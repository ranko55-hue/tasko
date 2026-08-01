-- 019: שעות עבודה ארגוניות + שעת התחלה מתוזמנת למשימה.
--
-- חלק א: שעות עבודה — הגדרה ארגונית יחידה שקובעת את חלון יום העבודה.
--         ברירת מחדל 08:00–17:00; חלה על חישוב "זמן עבודה נותר עד היעד".
-- חלק ב: start_time — שעת ההתחלה המתוזמנת, מקביל ל-due_time.
-- חלק ג: תיעוד start_time ביומן העריכות.

-- ── חלק א: שעות עבודה בארגון ──────────────────────────────────────────────
alter table organizations
  add column if not exists work_start_time time not null default time '08:00',
  add column if not exists work_end_time   time not null default time '17:00';

-- ── חלק ב: שעת התחלה מתוזמנת למשימה ──────────────────────────────────────
alter table tasks
  add column if not exists start_time time not null default time '08:00';

-- ── חלק ג: תיעוד start_time ביומן ────────────────────────────────────────
-- מחליפים את הפונקציה כדי לעקוב גם אחרי שינויי start_time.
create or replace function tasks_guard_manager_edit()
returns trigger language plpgsql security definer set search_path = public as $$
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

  v_is_mgr := v_role in ('project_manager','work_manager');

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
  if new.start_time is distinct from old.start_time then
    v_changes := v_changes || jsonb_build_object('field','start_time','from',old.start_time,'to',new.start_time);
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
end $$;
