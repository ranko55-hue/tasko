-- 028: יומן פגישות. פגישות = מנהל ומעלה (admin/manager); עובדים לא רואים יומן.
--
-- מחזוריות בגישה פשוטה: שומרים את הכלל (recurrence + recurrence_until) על שורת
-- המאסטר ומרחיבים לתצוגה בזמן ריצה — לא משכפלים רשומות. חריגים:
--   • "רק פגישה זו" בעריכה → יוצרים שורה עצמאית (parent_id, recurrence none)
--     ומוסיפים את תאריך המופע ל-excluded_dates של המאסטר.
--   • מחיקת מופע בודד → הוספת התאריך ל-excluded_dates בלבד.

create type meeting_recurrence as enum ('none', 'daily', 'weekly', 'biweekly', 'monthly');

create table meetings (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations(id) on delete cascade,
  title            text not null,
  client_id        uuid references clients(id) on delete set null,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  location         text,
  notes            text,
  recurrence       meeting_recurrence not null default 'none',
  recurrence_until date,
  parent_id        uuid references meetings(id) on delete cascade,
  excluded_dates   date[] not null default '{}',
  created_by       uuid references org_members(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index on meetings (org_id, starts_at);
create index on meetings (client_id);

alter table meetings enable row level security;

-- מנהל ומעלה בלבד (admin/manager) לכל הפעולות.
create policy meetings_select on meetings for select
  using (my_role(org_id) in ('admin', 'manager'));
create policy meetings_insert on meetings for insert
  with check (my_role(org_id) in ('admin', 'manager'));
create policy meetings_update on meetings for update
  using (my_role(org_id) in ('admin', 'manager'))
  with check (my_role(org_id) in ('admin', 'manager'));
create policy meetings_delete on meetings for delete
  using (my_role(org_id) in ('admin', 'manager'));
