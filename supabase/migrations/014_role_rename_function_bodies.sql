-- 014: תיקון גופי הפונקציות אחרי שינוי שמות התפקידים במיגרציה 013.
--
-- ⚠️ הלקח: ALTER TYPE ... RENAME VALUE נגרר אוטומטית ל-policies, כי הקבוע
-- שם נשמר כ-OID של ערך ה-enum. גופי פונקציות לעומת זאת נשמרים כטקסט
-- ומתפרשים מחדש בכל הרצה — ולכן המחרוזת 'project_manager' בתוכם הפכה
-- לערך שאינו קיים עוד בטיפוס, וכל אחת מחמש הפונקציות האלה נכשלה בזמן ריצה:
--
--   create_organization       — הרשמת ארגון חדש נשברה לגמרי
--   can_access_task_media     — גישה למדיה בציר הזמן נחסמה
--   can_access_project_file   — לשונית הקבצים נחסמה
--   cancel_task               — ביטול משימה נכשל
--   tasks_guard_manager_edit  — טריגר העריכה נכשל בכל עדכון משימה
--
-- הגופים כאן זהים למקור מילה במילה; השינוי היחיד הוא רשימת התפקידים.

-- ── create_organization: הבעלים נוצר כ-admin ───────────────────────────
create or replace function public.create_organization(
  p_org_name text, p_full_name text, p_phone text default null, p_gender text default 'm')
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_org uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_org_name is null or length(trim(p_org_name)) < 2 then
    raise exception 'invalid_org_name';
  end if;
  -- MVP: משתמש שייך לארגון אחד בלבד
  if exists (select 1 from org_members where auth_user_id = auth.uid()) then
    raise exception 'already_member';
  end if;

  insert into organizations (name) values (trim(p_org_name)) returning id into v_org;

  insert into org_members (org_id, auth_user_id, full_name, phone, role, gender)
  values (v_org, auth.uid(), trim(p_full_name), p_phone, 'admin',
          case when p_gender in ('m','f') then p_gender else 'm' end);

  return v_org;
end $function$;

-- ── can_access_task_media ──────────────────────────────────────────────
create or replace function public.can_access_task_media(p_name text)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select exists (
    select 1
      from public.tasks t
     where (storage.foldername(p_name))[1] ~ '^[0-9a-fA-F-]{36}$'
       and (storage.foldername(p_name))[2] ~ '^[0-9]+$'
       and t.id = ((storage.foldername(p_name))[2])::bigint
       and t.org_id = ((storage.foldername(p_name))[1])::uuid
       and t.org_id in (select public.my_org_ids())
       and (
         public.my_role(t.org_id) in ('admin','manager')
         or t.assignee_id in (select public.my_member_ids())
         or t.team_lead_id in (select public.my_member_ids())
       )
  )
$function$;

-- ── can_access_project_file ────────────────────────────────────────────
create or replace function public.can_access_project_file(p_name text)
returns boolean language sql stable security definer set search_path to 'public' as $function$
  select exists (
    select 1
      from public.projects p
     where (storage.foldername(p_name))[1] ~ '^[0-9a-fA-F-]{36}$'
       and (storage.foldername(p_name))[2] ~ '^[0-9a-fA-F-]{36}$'
       and p.id     = ((storage.foldername(p_name))[2])::uuid
       and p.org_id = ((storage.foldername(p_name))[1])::uuid
       and p.org_id in (select public.my_org_ids())
       and public.my_role(p.org_id) in ('admin','manager')
  )
$function$;

-- ── cancel_task ────────────────────────────────────────────────────────
create or replace function public.cancel_task(p_task_id bigint, p_reason text)
returns void language plpgsql security definer set search_path to 'public' as $function$
declare
  v_org uuid;
  v_actor uuid;
  v_role member_role;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'reason_required';
  end if;

  select org_id into v_org from tasks where id = p_task_id;
  if v_org is null then
    raise exception 'task_not_found';
  end if;

  select m.id, m.role into v_actor, v_role
    from org_members m
   where m.auth_user_id = auth.uid() and m.org_id = v_org and m.is_active
   limit 1;

  if v_role is null or v_role not in ('admin','manager') then
    raise exception 'not_manager';
  end if;

  update tasks
     set status = 'cancelled',
         work_started_at = null
   where id = p_task_id;

  insert into task_events (org_id, task_id, actor_id, type, payload)
  values (v_org, p_task_id, v_actor, 'cancelled', jsonb_build_object('text', trim(p_reason)));
end $function$;

-- ── tasks_guard_manager_edit ───────────────────────────────────────────
create or replace function public.tasks_guard_manager_edit()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  v_actor uuid;
  v_role member_role;
  v_is_mgr boolean;
  v_changes jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then
    return new;
  end if;

  select m.id, m.role into v_actor, v_role
    from org_members m
   where m.auth_user_id = auth.uid() and m.org_id = new.org_id and m.is_active
   limit 1;

  v_is_mgr := v_role in ('admin','manager');

  if new.title is distinct from old.title then
    v_changes := v_changes || jsonb_build_object('field','title','from',old.title,'to',new.title);
  end if;
  if new.description is distinct from old.description then
    v_changes := v_changes || jsonb_build_object('field','description','from',old.description,'to',new.description);
  end if;
  if new.address is distinct from old.address then
    v_changes := v_changes || jsonb_build_object('field','address','from',old.address,'to',new.address);
  end if;
  if new.client_id is distinct from old.client_id then
    v_changes := v_changes || jsonb_build_object(
      'field','client_id',
      'from',(select c.name from clients c where c.id = old.client_id),
      'to',  (select c.name from clients c where c.id = new.client_id));
  end if;
  if new.project_id is distinct from old.project_id then
    v_changes := v_changes || jsonb_build_object(
      'field','project_id',
      'from',(select p.name from projects p where p.id = old.project_id),
      'to',  (select p.name from projects p where p.id = new.project_id));
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    v_changes := v_changes || jsonb_build_object(
      'field','assignee_id',
      'from',(select m.full_name from org_members m where m.id = old.assignee_id),
      'to',  (select m.full_name from org_members m where m.id = new.assignee_id));
  end if;
  if new.team_lead_id is distinct from old.team_lead_id then
    v_changes := v_changes || jsonb_build_object(
      'field','team_lead_id',
      'from',(select m.full_name from org_members m where m.id = old.team_lead_id),
      'to',  (select m.full_name from org_members m where m.id = new.team_lead_id));
  end if;
  if new.starts_on is distinct from old.starts_on then
    v_changes := v_changes || jsonb_build_object('field','starts_on','from',old.starts_on,'to',new.starts_on);
  end if;
  if new.ends_on is distinct from old.ends_on then
    v_changes := v_changes || jsonb_build_object('field','ends_on','from',old.ends_on,'to',new.ends_on);
  end if;
  if new.due_time is distinct from old.due_time then
    v_changes := v_changes || jsonb_build_object('field','due_time','from',old.due_time,'to',new.due_time);
  end if;
  if new.est_minutes is distinct from old.est_minutes then
    v_changes := v_changes || jsonb_build_object('field','est_minutes','from',old.est_minutes,'to',new.est_minutes);
  end if;
  if new.priority is distinct from old.priority then
    v_changes := v_changes || jsonb_build_object('field','priority','from',old.priority,'to',new.priority);
  end if;
  if new.requirements is distinct from old.requirements then
    v_changes := v_changes || jsonb_build_object('field','requirements','from',old.requirements,'to',new.requirements);
  end if;
  if new.required_workers is distinct from old.required_workers then
    v_changes := v_changes || jsonb_build_object('field','required_workers','from',old.required_workers,'to',new.required_workers);
  end if;

  if jsonb_array_length(v_changes) > 0 and not v_is_mgr then
    raise exception 'not_manager';
  end if;

  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and not v_is_mgr then
    raise exception 'not_manager';
  end if;

  if jsonb_array_length(v_changes) > 0 then
    insert into task_events (org_id, task_id, actor_id, type, payload)
    values (new.org_id, new.id, v_actor, 'edited', jsonb_build_object('changes', v_changes));
  end if;

  return new;
end $function$;
