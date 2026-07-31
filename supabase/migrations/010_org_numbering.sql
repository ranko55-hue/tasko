-- 010: מספור רץ קריא ללקוחות ולפרויקטים, נפרד לכל ארגון, החל מ-1001.
--
-- הרקע: ללקוחות ולפרויקטים יש רק מזהה uuid, שאי אפשר להקריא בטלפון או לחפש לפיו.
-- המשימות כבר נושאות מספר קריא (tasks.id, bigint identity), ולכן כאן מיישרים גם
-- את הלקוחות ואת הפרויקטים לאותה שפה: ‎#1001, ‎#1002 ...
--
-- למה מונה בטבלה ולא sequence לכל ארגון: sequence-per-org היה מייצר אובייקט DDL
-- חדש בכל הרשמה, בלי RLS ובלי ניקוי במחיקת ארגון. טבלת מונים היא נתון רגיל —
-- נמחקת ב-cascade עם הארגון, וה-upsert למטה אטומי ולכן בטוח מול הרשמות מקבילות.

-- ── טבלת המונים ─────────────────────────────────────────────────────────────
create table if not exists org_counters (
  org_id      uuid not null references organizations(id) on delete cascade,
  entity      text not null check (entity in ('client', 'project')),
  last_number integer not null default 1000,
  primary key (org_id, entity)
);

alter table org_counters enable row level security;

-- אין policy במכוון: הטבלה נגישה רק דרך next_org_number (security definer).
-- הלקוח לעולם לא קורא או כותב אליה ישירות.

-- ── הקצאת המספר הבא ────────────────────────────────────────────────────────
-- ה-upsert נועל את שורת המונה עד סוף הטרנזקציה, ולכן שתי הוספות במקביל באותו
-- ארגון מקבלות שני מספרים שונים ולא נכשלות על ה-unique.
create or replace function next_org_number(p_org_id uuid, p_entity text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into org_counters (org_id, entity, last_number)
  values (p_org_id, p_entity, 1001)
  on conflict (org_id, entity)
    do update set last_number = org_counters.last_number + 1
  returning last_number into n;
  return n;
end;
$$;

-- ── העמודות ────────────────────────────────────────────────────────────────
alter table clients  add column if not exists number integer;
alter table projects add column if not exists number integer;

-- ── מילוי רשומות קיימות לפי סדר היצירה ─────────────────────────────────────
with numbered as (
  select id,
         1000 + row_number() over (partition by org_id order by created_at, id) as n
    from clients
   where number is null
)
update clients c set number = numbered.n
  from numbered where numbered.id = c.id;

with numbered as (
  select id,
         1000 + row_number() over (partition by org_id order by created_at, id) as n
    from projects
   where number is null
)
update projects p set number = numbered.n
  from numbered where numbered.id = p.id;

-- המונה מיישר את עצמו לרשומות שכבר קיימות, כדי שההוספה הבאה תמשיך מהמקום הנכון.
insert into org_counters (org_id, entity, last_number)
select org_id, 'client', max(number) from clients where number is not null group by org_id
on conflict (org_id, entity) do update set last_number = greatest(org_counters.last_number, excluded.last_number);

insert into org_counters (org_id, entity, last_number)
select org_id, 'project', max(number) from projects where number is not null group by org_id
on conflict (org_id, entity) do update set last_number = greatest(org_counters.last_number, excluded.last_number);

-- ── אילוצים ואינדקסים ──────────────────────────────────────────────────────
alter table clients  alter column number set not null;
alter table projects alter column number set not null;

create unique index if not exists clients_org_number_key  on clients  (org_id, number);
create unique index if not exists projects_org_number_key on projects (org_id, number);

-- ── טריגרים להקצאה אוטומטית ────────────────────────────────────────────────
create or replace function set_client_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null then
    new.number := next_org_number(new.org_id, 'client');
  end if;
  return new;
end;
$$;

create or replace function set_project_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null then
    new.number := next_org_number(new.org_id, 'project');
  end if;
  return new;
end;
$$;

drop trigger if exists clients_set_number  on clients;
drop trigger if exists projects_set_number on projects;

create trigger clients_set_number  before insert on clients  for each row execute function set_client_number();
create trigger projects_set_number before insert on projects for each row execute function set_project_number();

-- ── יישור מספור המשימות ────────────────────────────────────────────────────
-- tasks.id הוא identity גלובלי (לא לכל ארגון) והוא מפתח ראשי שטבלת task_events
-- מפנה אליו, ולכן המרה למספור לכל ארגון הייתה כרוכה בכתיבה מחדש של כל ההפניות.
-- כאן מיישרים רק את נקודת ההתחלה, כדי שמשימות חדשות יתחילו גם הן ב-1001.
do $$
declare
  next_id bigint;
begin
  select coalesce(max(id), 1000) + 1 into next_id from tasks;
  if next_id < 1001 then
    next_id := 1001;
  end if;
  execute format('alter table tasks alter column id restart with %s', next_id);
end $$;
