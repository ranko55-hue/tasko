-- ============================================================
-- 005: יומן אירועים למשימה (Timeline)
-- תבנית מוכחת מפרויקט קודם: תיעוד אוטומטי + רישום ידני
-- ============================================================

create table public.task_events (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  task_id     uuid not null references public.tasks(id) on delete cascade,
  member_id   uuid references public.org_members(id) on delete set null,
  event_type  text not null
              check (event_type in (
                'created',        -- המשימה נפתחה
                'assigned',       -- הוקצתה לעובד
                'status_change',  -- שינוי סטטוס
                'note',           -- הערה ידנית
                'data_update'     -- עדכון נתונים ע"י העובד
              )),
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index idx_task_events_task on public.task_events(task_id, created_at);
create index idx_task_events_org  on public.task_events(org_id);

alter table public.task_events enable row level security;

-- קריאה: לפי אותה לוגיקה של המשימה עצמה
create policy "read events by task access"
  on public.task_events for select
  using (
    org_id = public.current_org_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (public.current_role_in_org() = 'manager'
             or t.assignee_id = public.current_member_id())
    )
  );

-- הוספת אירוע ידני (הערה) — כל מי שרואה את המשימה
create policy "insert events by task access"
  on public.task_events for insert
  with check (
    org_id = public.current_org_id()
    and exists (
      select 1 from public.tasks t
      where t.id = task_id
        and (public.current_role_in_org() = 'manager'
             or t.assignee_id = public.current_member_id())
    )
  );

-- אירועים לא נערכים ולא נמחקים — יומן הוא יומן.

-- ============================================================
-- תיעוד אוטומטי: פתיחה, הקצאה ושינוי סטטוס
-- ============================================================
create or replace function public.log_task_event()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_events (org_id, task_id, member_id, event_type, details)
    values (new.org_id, new.id, new.created_by, 'created',
            jsonb_build_object('title', new.title));
    if new.assignee_id is not null then
      insert into public.task_events (org_id, task_id, member_id, event_type, details)
      values (new.org_id, new.id, new.created_by, 'assigned',
              jsonb_build_object('assignee_id', new.assignee_id));
    end if;

  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.task_events (org_id, task_id, member_id, event_type, details)
      values (new.org_id, new.id, public.current_member_id(), 'status_change',
              jsonb_build_object('from', old.status, 'to', new.status));
    end if;
    if new.assignee_id is distinct from old.assignee_id then
      insert into public.task_events (org_id, task_id, member_id, event_type, details)
      values (new.org_id, new.id, public.current_member_id(), 'assigned',
              jsonb_build_object('assignee_id', new.assignee_id));
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_log_task_event
  after insert or update on public.tasks
  for each row execute function public.log_task_event();
