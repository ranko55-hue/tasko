-- איפוס נקי (בטוח כרגע — אין עדיין נתונים אמיתיים)
drop function if exists create_organization(text,text,text,text);
drop function if exists my_role(uuid);
drop function if exists my_org_ids();
drop table if exists service_requests cascade;
drop table if exists client_documents cascade;
drop table if exists task_events cascade;
drop table if exists tasks cascade;
drop table if exists projects cascade;
drop table if exists clients cascade;
drop table if exists org_members cascade;
drop table if exists organizations cascade;
drop type if exists request_status;
drop type if exists doc_status;
drop type if exists doc_kind;
drop type if exists event_type;
drop type if exists task_priority;
drop type if exists task_status;
drop type if exists project_status;
drop type if exists member_role;

-- 001: ארגונים וחברי ארגון (היררכיה: מנהל פרויקט > מנהל עבודה > ראש צוות > עובד)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create type member_role as enum ('project_manager','work_manager','team_lead','worker');

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  auth_user_id uuid unique, -- מזוהה מול Supabase Auth; null עד שההזמנה מומשה
  full_name text not null,
  phone text,
  role member_role not null default 'worker',
  gender text not null default 'm' check (gender in ('m','f')), -- לפנייה מגדרית של העוזר הקולי
  invite_token uuid unique default gen_random_uuid(), -- להזמנת SMS
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index on org_members (org_id);
create index on org_members (auth_user_id);

-- 002: לקוחות + קישור ייחודי לטופס קריאות שירות
create table clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  business_id text, -- ח.פ / עוסק
  address text,
  payment_terms text, -- למשל: שוטף+60
  service_slug text unique not null default replace(gen_random_uuid()::text,'-',''), -- tasko.app/r/<slug>
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on clients (org_id);
create index on clients (service_slug);

-- 003: פרויקטים — אין משימות באוויר: לקוח ← פרויקט ← משימה
create type project_status as enum ('open','closed');

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  name text not null,
  status project_status not null default 'open',
  address text,
  starts_at date,
  ends_at date,
  created_at timestamptz not null default now()
);
create index on projects (org_id);
create index on projects (client_id);

-- 004: משימות — הלב של Tasko (אפיון v7 סעיף 3.1)
create type task_status as enum ('scheduled','pending','in_progress','paused','blocked','done','cancelled');
create type task_priority as enum ('normal','urgent');

create table tasks (
  id bigint generated always as identity primary key, -- מספר משימה קריא (#1041)
  org_id uuid not null references organizations(id) on delete cascade,
  project_id uuid not null references projects(id) on delete restrict, -- חובה! אין משימות באוויר
  title text not null,
  description text,
  address text,
  assignee_id uuid references org_members(id) on delete set null,
  created_by uuid references org_members(id) on delete set null,
  status task_status not null default 'pending',
  priority task_priority not null default 'normal',
  due_at timestamptz, -- יעד לסיום (מוצג בגדול לעובד)
  scheduled_start_at timestamptz, -- משימה עתידית: זמן תחילת ביצוע
  est_minutes int, -- מסגרת זמן מוקצבת — בסיס להתראת חריגה
  requirements jsonb not null default '[]'::jsonb, -- ["רכב מנוף","סולם 4 מ׳"]
  required_workers int not null default 1, -- משימת צוות: כמה נדרשים
  team_lead_id uuid references org_members(id) on delete set null, -- ראש צוות מעדכן בשם הצוות
  net_seconds int not null default 0, -- זמן נטו מצטבר (השהיות לא נספרות)
  work_started_at timestamptz, -- תחילת מקטע העבודה הנוכחי (null=לא רץ)
  overrun_alerted boolean not null default false, -- התראת חריגה נשלחה
  service_request_id uuid, -- אם נולדה מקריאת לקוח
  created_at timestamptz not null default now()
);
create index on tasks (org_id, status);
create index on tasks (assignee_id, status);
create index on tasks (project_id);

-- 005: ציר הזמן החתום — כל אירוע עם חותמת (תשתית גם להערכת עובד בשלב 2)
create type event_type as enum (
  'created','assigned','started','paused','resumed','finished',
  'photo','voice_note','text_note','manager_attachment',
  'blocked','unblocked','overrun','status_change','from_service_request'
);

create table task_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  task_id bigint not null references tasks(id) on delete cascade,
  actor_id uuid references org_members(id) on delete set null,
  type event_type not null,
  payload jsonb not null default '{}'::jsonb, -- {"text":"...","file_url":"...","seconds":123}
  created_at timestamptz not null default now()
);
create index on task_events (task_id, created_at);
create index on task_events (org_id, created_at);

-- 006: לשונית כספים = מאגר מסמכים ב-MVP (אפיון 3.5)
create type doc_kind as enum ('quote','delivery_note','invoice','receipt','other');
create type doc_status as enum ('draft','sent','approved','paid','rejected');

create table client_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  kind doc_kind not null,
  title text not null, -- "הצעת מחיר HC-2041"
  amount numeric(12,2),
  status doc_status not null default 'draft',
  file_url text, -- Supabase Storage
  created_at timestamptz not null default now()
);
create index on client_documents (client_id);

-- 007: טופס קריאת שירות ללקוח (אפיון 3.8) — נכנס דרך service_slug, בלי התחברות
create type request_status as enum ('new','converted','dismissed');

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade, -- משויך אוטומטית לפי הקישור
  requester_name text not null,
  requester_phone text not null,
  location_text text,
  description text not null,
  photo_url text,
  status request_status not null default 'new',
  converted_task_id bigint references tasks(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on service_requests (org_id, status);

alter table tasks add constraint tasks_service_request_fk
  foreign key (service_request_id) references service_requests(id) on delete set null;

-- 008: אבטחת שורות (RLS) — כל אחד רואה רק את הארגון שלו
create or replace function my_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select org_id from org_members where auth_user_id = auth.uid() and is_active
$$;

create or replace function my_role(p_org uuid)
returns member_role language sql stable security definer set search_path = public as $$
  select role from org_members where auth_user_id = auth.uid() and org_id = p_org and is_active limit 1
$$;

alter table organizations enable row level security;
alter table org_members enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table client_documents enable row level security;
alter table service_requests enable row level security;

-- ארגון: חברים רואים; יצירה חופשית (הנרשם הראשון)
create policy org_select on organizations for select using (id in (select my_org_ids()));
create policy org_insert on organizations for insert with check (true);

-- חברים: רואים את חברי הארגון; מנהלים מוסיפים/מעדכנים
create policy mem_select on org_members for select using (org_id in (select my_org_ids()));
create policy mem_insert on org_members for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager')
  or not exists (select 1 from org_members m where m.org_id = org_members.org_id) -- החבר הראשון בארגון חדש
);
create policy mem_update on org_members for update using (
  org_id in (select my_org_ids())
  and (my_role(org_id) in ('project_manager','work_manager') or auth_user_id = auth.uid())
);

-- תבנית אחידה לישויות הארגון: חברים רואים; מנהלים כותבים
create policy cli_all on clients for all using (org_id in (select my_org_ids()))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy prj_all on projects for all using (org_id in (select my_org_ids()))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy doc_all on client_documents for all using (org_id in (select my_org_ids()))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));

-- משימות: כולם רואים לפי היררכיה בסיסית (MVP: עובד רואה את שלו, מנהלים הכל)
create policy task_select on tasks for select using (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) in ('project_manager','work_manager')
    or assignee_id in (select id from org_members where auth_user_id = auth.uid())
    or team_lead_id in (select id from org_members where auth_user_id = auth.uid())
  )
);
create policy task_write_mgr on tasks for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager')
);
create policy task_update on tasks for update using (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) in ('project_manager','work_manager')
    or assignee_id in (select id from org_members where auth_user_id = auth.uid())
    or team_lead_id in (select id from org_members where auth_user_id = auth.uid())
  )
);

-- אירועים: מי שרואה את המשימה — רואה ומוסיף אירועים
create policy ev_select on task_events for select using (org_id in (select my_org_ids()));
create policy ev_insert on task_events for insert with check (org_id in (select my_org_ids()));

-- קריאות שירות: מנהלים רואים ומטפלים; הוספה גם אנונימית (הטופס הציבורי משתמש ב-Edge Function עם service key)
create policy sr_select on service_requests for select using (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy sr_update on service_requests for update using (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));

-- 009: יצירת ארגון + מנהל ראשון — אטומית, בצד שרת (במקום Edge Function)
-- הלקוח קורא: supabase.rpc('create_organization', { p_org_name, p_full_name, p_phone, p_gender })
create or replace function create_organization(
  p_org_name text,
  p_full_name text,
  p_phone text default null,
  p_gender text default 'm'
) returns uuid language plpgsql security definer set search_path = public as $$
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
  values (v_org, auth.uid(), trim(p_full_name), p_phone, 'project_manager',
          case when p_gender in ('m','f') then p_gender else 'm' end);

  return v_org;
end $$;

revoke all on function create_organization(text,text,text,text) from public;
grant execute on function create_organization(text,text,text,text) to authenticated;

-- ניקוי: עכשיו כשיש RPC, מהדקים את המדיניות הפתוחה מ-008
drop policy if exists org_insert on organizations;
drop policy if exists mem_insert on org_members;
create policy mem_insert on org_members for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager')
);
