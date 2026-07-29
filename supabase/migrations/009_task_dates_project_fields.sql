-- 009: חוק התאריכים במשימה + שדות פרויקט.
--
-- מודל התאריכים: המשתמש מזין תאריך התחלה, תאריך סיום ושעת יעד.
-- due_at אינו שדה קלט יותר אלא **נגזרת** — טריגר מחשב אותו מ-(ends_on + due_time)
-- בשעון ישראל. כך נשמר שדה מועד יחיד להשוואות, לאינדקס ולשאילתות האיחור,
-- וכל הקוד שכבר קורא due_at ממשיך לעבוד בלי שינוי.
--
-- משימה מרובת ימים אינה סוג נפרד: היא פשוט משימה ש-starts_on שונה בה מ-ends_on.

-- ── חלק א: תאריכי משימה ─────────────────────────────────────────────────
alter table tasks add column if not exists starts_on date;
alter table tasks add column if not exists ends_on   date;
alter table tasks add column if not exists due_time  time;

-- מילוי לאחור: משימה קיימת שומרת את המועד שלה.
-- יש due_at → נגזרים ממנו התאריך והשעה; אין → תאריך היצירה וסוף היום.
update tasks
   set starts_on = coalesce(starts_on, (coalesce(due_at, created_at) at time zone 'Asia/Jerusalem')::date),
       ends_on   = coalesce(ends_on,   (coalesce(due_at, created_at) at time zone 'Asia/Jerusalem')::date),
       due_time  = coalesce(due_time,
                     case when due_at is null then time '23:59'
                          else (due_at at time zone 'Asia/Jerusalem')::time end)
 where starts_on is null or ends_on is null or due_time is null;

alter table tasks alter column starts_on set default current_date;
alter table tasks alter column ends_on   set default current_date;
alter table tasks alter column due_time  set default time '23:59';

alter table tasks alter column starts_on set not null;
alter table tasks alter column ends_on   set not null;
alter table tasks alter column due_time  set not null;

-- ends_on לא יכול להקדים את starts_on
alter table tasks drop constraint if exists tasks_dates_order;
alter table tasks add constraint tasks_dates_order check (ends_on >= starts_on);

-- due_at נגזר תמיד מהשדות שהמשתמש הזין
create or replace function tasks_sync_due_at()
returns trigger language plpgsql as $$
begin
  new.due_at := (new.ends_on::timestamp + new.due_time) at time zone 'Asia/Jerusalem';
  return new;
end $$;

-- שם הטריגר נבחר כך שירוץ לפני trg_tasks_guard_manager_edit (סדר אלפביתי),
-- כדי שהמנהל יראה ביומן את שינוי המועד בפועל ולא ערך ישן.
drop trigger if exists trg_tasks_dates on tasks;
create trigger trg_tasks_dates
  before insert or update on tasks
  for each row execute function tasks_sync_due_at();

update tasks set starts_on = starts_on; -- מפעיל את הטריגר ומיישר due_at קיים

create index if not exists tasks_ends_on_idx on tasks (ends_on);

-- ── חלק ב: שדות פרויקט ──────────────────────────────────────────────────
-- address כבר nullable מ-000 ולכן אין מה לשנות; שם הפרויקט נשאר החובה היחידה.
alter table projects add column if not exists sku     text;
alter table projects add column if not exists details text;

create index if not exists projects_sku_idx on projects (sku);

-- ── יומן העריכה: התאריכים החדשים נרשמים, due_at הנגזר יוצא ───────────────
-- בלי זה היומן היה מציג "שונה יעד לסיום" על שדה שהמשתמש לא נגע בו.
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
