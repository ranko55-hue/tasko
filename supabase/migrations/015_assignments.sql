-- 015: שלב ב של "המבנה הארגוני" — הקצאות.
--
-- שני קשרים:
--   לקוח ↔ מנהל   — many-to-many. לקוח יכול להיות מוקצה לכמה מנהלים,
--                    ומנהל מחזיק כמה לקוחות.
--   עובד → מנהל    — אחד לכל היותר, אופציונלי. עובד בלי מנהל כפוף
--                    אוטומטית ל-admin ונראה לו בלבד (נאכף ב-RLS בשלב ג).
--
-- הערה על אכיפת תפקידים: לא הוספתי CHECK שמחייב שהצד המנהל יהיה בתפקיד
-- manager/admin, כי CHECK לא יכול לקרוא טבלה אחרת ותפקיד משתנה עם הזמן —
-- טריגר כזה היה חוסם שינוי תפקיד לגיטימי של מנהל שכבר יש לו לקוחות.
-- האכיפה בבחירה ב-UI, והנראות עצמה נגזרת ב-RLS מהתפקיד בפועל.

-- ── לקוח ↔ מנהל ────────────────────────────────────────────────────────
create table if not exists client_managers (
  client_id  uuid not null references clients(id)     on delete cascade,
  member_id  uuid not null references org_members(id) on delete cascade,
  org_id     uuid not null references organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, member_id)
);

create index if not exists client_managers_member_idx on client_managers (member_id);
create index if not exists client_managers_org_idx    on client_managers (org_id);

alter table client_managers enable row level security;

-- קריאה: חברי הארגון (העובד לא באמת מגיע לכאן — הוא חסום ברמת הלקוחות).
drop policy if exists cm_select on client_managers;
create policy cm_select on client_managers for select
  using (org_id in (select my_org_ids()));

-- כתיבה: admin בלבד. הקצאה היא פעולה ניהולית.
drop policy if exists cm_insert on client_managers;
create policy cm_insert on client_managers for insert
  with check (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

drop policy if exists cm_delete on client_managers;
create policy cm_delete on client_managers for delete
  using (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

-- ── עובד → מנהל ────────────────────────────────────────────────────────
alter table org_members add column if not exists manager_id uuid
  references org_members(id) on delete set null;

create index if not exists org_members_manager_idx on org_members (manager_id);

-- אי אפשר להיות המנהל של עצמך
alter table org_members drop constraint if exists org_members_manager_not_self;
alter table org_members add constraint org_members_manager_not_self
  check (manager_id is null or manager_id <> id);
