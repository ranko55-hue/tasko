-- ============================================================
-- 004: משימות — לב המערכת
-- טיוטה — רשימת הסטטוסים והשדות תיסגר באפיון
-- ============================================================

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  client_id    uuid references public.clients(id) on delete set null,
  assignee_id  uuid references public.org_members(id) on delete set null,
  created_by   uuid not null references public.org_members(id),
  title        text not null,
  description  text,
  status       text not null default 'new'
               check (status in ('new', 'accepted', 'in_progress', 'done', 'cancelled')),
  priority     text not null default 'normal'
               check (priority in ('low', 'normal', 'high', 'urgent')),
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_tasks_org      on public.tasks(org_id);
create index idx_tasks_assignee on public.tasks(assignee_id);
create index idx_tasks_client   on public.tasks(client_id);
create index idx_tasks_status   on public.tasks(org_id, status);

alter table public.tasks enable row level security;

-- ה-member_id של המשתמש המחובר (עזר למדיניות עובד)
create or replace function public.current_member_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.org_members
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- מנהל רואה את כל משימות הארגון; עובד רואה רק משימות שהוקצו לו
create policy "read tasks by role"
  on public.tasks for select
  using (
    org_id = public.current_org_id()
    and (
      public.current_role_in_org() = 'manager'
      or assignee_id = public.current_member_id()
    )
  );

-- פתיחת משימה — מנהל בלבד
create policy "manager inserts tasks"
  on public.tasks for insert
  with check (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

-- עדכון: מנהל — כל משימה בארגון; עובד — רק משימה שלו
create policy "update tasks by role"
  on public.tasks for update
  using (
    org_id = public.current_org_id()
    and (
      public.current_role_in_org() = 'manager'
      or assignee_id = public.current_member_id()
    )
  );

-- מחיקה — מנהל בלבד
create policy "manager deletes tasks"
  on public.tasks for delete
  using (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

-- ============================================================
-- אכיפת מגבלת משימות פתוחות לפי חבילה
-- ============================================================
create or replace function public.enforce_task_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  open_count integer;
  org_limit  integer;
begin
  select count(*) into open_count
  from public.tasks
  where org_id = new.org_id and status not in ('done', 'cancelled');

  select max_open_tasks into org_limit
  from public.organizations where id = new.org_id;

  if open_count >= org_limit then
    raise exception 'הגעתם למגבלת המשימות הפתוחות בחבילה הנוכחית';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_task_limit
  before insert on public.tasks
  for each row execute function public.enforce_task_limit();

-- עדכון updated_at אוטומטי
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tasks_touch
  before update on public.tasks
  for each row execute function public.touch_updated_at();
