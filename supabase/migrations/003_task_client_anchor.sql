-- 003: הלקוח כעוגן של המשימה (אפיון v8 §3.4) + הגדרות ארגון (§3.9)
-- דרישה מוקדמת: 002 הורץ והסתיים (ערכי ה-enum 'edited' ו-'cancelled' קיימים).

-- ── §3.9 הגדרת ארגון: חיוב שיוך לפרויקט ─────────────────────────────────
alter table organizations
  add column if not exists require_project boolean not null default false;

-- organizations לא היה לו policy ל-update כלל, ולכן מסך ההגדרות לא היה יכול לשמור.
drop policy if exists org_update on organizations;
create policy org_update on organizations for update
  using (id in (select my_org_ids()) and my_role(id) in ('project_manager','work_manager'))
  with check (id in (select my_org_ids()) and my_role(id) in ('project_manager','work_manager'));

-- ── §3.4 client_id על המשימה ────────────────────────────────────────────
-- on delete restrict: ב-Tasko לא מוחקים לקוח/פרויקט — סוגרים אותם.
alter table tasks
  add column if not exists client_id uuid references clients(id) on delete restrict;

-- מילוי לאחור מהלקוח של הפרויקט (כל המשימות הקיימות שייכות לפרויקט, שהיה חובה)
update tasks t
   set client_id = p.client_id
  from projects p
 where p.id = t.project_id
   and t.client_id is null;

-- אם נשארה משימה בלי לקוח — עוצרים במקום להשתיק. אין דרך נכונה לנחש שיוך.
do $$
declare v_orphans int;
begin
  select count(*) into v_orphans from tasks where client_id is null;
  if v_orphans > 0 then
    raise exception 'הגירה נעצרה: % משימות ללא client_id לאחר המילוי לאחור', v_orphans;
  end if;
end $$;

alter table tasks alter column client_id set not null;

-- הפרויקט הופך לרשות
alter table tasks alter column project_id drop not null;

create index if not exists tasks_client_id_idx on tasks (client_id);

-- ── שלמות נתונים: פרויקט חייב להשתייך לאותו לקוח ────────────────────────
-- נאכף תמיד, גם ל-service_role — זהו כלל נתונים ולא כלל הרשאות.
create or replace function tasks_check_client_project()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_require_project boolean;
begin
  if new.project_id is not null then
    if not exists (
      select 1 from projects p
       where p.id = new.project_id
         and p.client_id = new.client_id
    ) then
      raise exception 'project_client_mismatch';
    end if;
  end if;

  -- §3.9 + הכרעה 2: require_project חוסם יצירה בלבד, לא עריכה של משימה קיימת
  if tg_op = 'INSERT' and new.project_id is null then
    select o.require_project into v_require_project
      from organizations o where o.id = new.org_id;
    if coalesce(v_require_project, false) then
      raise exception 'project_required';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists trg_tasks_check_client_project on tasks;
create trigger trg_tasks_check_client_project
  before insert or update on tasks
  for each row execute function tasks_check_client_project();

-- ── הרשאות עריכה + רישום אירוע 'edited' ─────────────────────────────────
-- policy task_update מאפשר גם ל-assignee/team_lead לעדכן (כך העובד מפעיל
-- start/pause/finish). לכן ההפרדה בין עובד למנהל היא ברמת העמודה, בטריגר.
create or replace function tasks_guard_manager_edit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid;
  v_role member_role;
  v_is_mgr boolean;
  v_changes jsonb := '[]'::jsonb;
begin
  -- ללא הקשר משתמש (service_role, SQL Editor, מיגרציות) — לא אוכפים
  if auth.uid() is null then
    return new;
  end if;

  select m.id, m.role into v_actor, v_role
    from org_members m
   where m.auth_user_id = auth.uid()
     and m.org_id = new.org_id
     and m.is_active
   limit 1;

  v_is_mgr := v_role in ('project_manager','work_manager');

  -- אוסף את השדות שהמנהל בלבד רשאי לשנות
  if new.title is distinct from old.title then
    v_changes := v_changes || jsonb_build_object('field','title','from',old.title,'to',new.title);
  end if;
  if new.description is distinct from old.description then
    v_changes := v_changes || jsonb_build_object('field','description','from',old.description,'to',new.description);
  end if;
  if new.address is distinct from old.address then
    v_changes := v_changes || jsonb_build_object('field','address','from',old.address,'to',new.address);
  end if;
  -- שדות מפתח זר נשמרים כשם קריא ולא כ-UUID, כדי שציר הזמן יהיה מובן בלי שליפות נוספות
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
  if new.due_at is distinct from old.due_at then
    v_changes := v_changes || jsonb_build_object('field','due_at','from',old.due_at,'to',new.due_at);
  end if;
  if new.scheduled_start_at is distinct from old.scheduled_start_at then
    v_changes := v_changes || jsonb_build_object('field','scheduled_start_at','from',old.scheduled_start_at,'to',new.scheduled_start_at);
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

  -- ביטול משימה — מנהלים בלבד (גיבוי ל-RPC cancel_task)
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' and not v_is_mgr then
    raise exception 'not_manager';
  end if;

  if jsonb_array_length(v_changes) > 0 then
    insert into task_events (org_id, task_id, actor_id, type, payload)
    values (new.org_id, new.id, v_actor, 'edited', jsonb_build_object('changes', v_changes));
  end if;

  return new;
end $$;

drop trigger if exists trg_tasks_guard_manager_edit on tasks;
create trigger trg_tasks_guard_manager_edit
  before update on tasks
  for each row execute function tasks_guard_manager_edit();

-- ── ביטול משימה: סיבה חובה, מנהלים בלבד, אטומי ──────────────────────────
create or replace function cancel_task(p_task_id bigint, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
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

  if v_role is null or v_role not in ('project_manager','work_manager') then
    raise exception 'not_manager';
  end if;

  update tasks
     set status = 'cancelled',
         work_started_at = null
   where id = p_task_id;

  insert into task_events (org_id, task_id, actor_id, type, payload)
  values (v_org, p_task_id, v_actor, 'cancelled', jsonb_build_object('text', trim(p_reason)));
end $$;
