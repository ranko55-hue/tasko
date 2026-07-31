-- 017: תיק עובד — שלב ד של המבנה הארגוני.
--
-- שלושה חלקים:
--   1. עמודות חדשות ב-org_members (phone2, email)
--   2. טבלת הערכות מנהל (employee_evaluations)
--   3. טבלת מסמכי עובד (employee_documents) + Storage bucket

-- ── 1. עמודות נוספות ב-org_members ──────────────────────────────────────
alter table org_members add column if not exists phone2 text;
alter table org_members add column if not exists email text;

-- ── 2. הערכות מנהל ─────────────────────────────────────────────────────
create table if not exists employee_evaluations (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  member_id  uuid not null references org_members(id) on delete cascade,
  author_id  uuid not null references org_members(id) on delete set null,
  rating     smallint not null check (rating between 1 and 5),
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists eval_member_idx on employee_evaluations (member_id, created_at desc);
create index if not exists eval_org_idx    on employee_evaluations (org_id);

alter table employee_evaluations enable row level security;

-- קריאה וכתיבה: admin + מנהל ישיר בלבד.
-- העובד עצמו לא רואה (ספציפית נדרש ע"י המשתמש).
create policy eval_select on employee_evaluations for select using (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) = 'admin'
    or exists (
      select 1 from org_members t
      where t.id = employee_evaluations.member_id
        and t.manager_id = (select id from org_members where auth_user_id = auth.uid() and org_id = employee_evaluations.org_id limit 1)
    )
  )
);

create policy eval_insert on employee_evaluations for insert with check (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) = 'admin'
    or exists (
      select 1 from org_members t
      where t.id = employee_evaluations.member_id
        and t.manager_id = (select id from org_members where auth_user_id = auth.uid() and org_id = employee_evaluations.org_id limit 1)
    )
  )
);

-- ── 3. מסמכי עובד ──────────────────────────────────────────────────────
create table if not exists employee_documents (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  member_id   uuid not null references org_members(id) on delete cascade,
  uploaded_by uuid references org_members(id) on delete set null,
  name        text not null,
  file_path   text not null,
  mime_type   text,
  expires_at  date,
  created_at  timestamptz not null default now()
);

create index if not exists empdoc_member_idx on employee_documents (member_id, created_at desc);
create index if not exists empdoc_org_idx    on employee_documents (org_id);

alter table employee_documents enable row level security;

-- מנהלים בלבד (admin + manager). מחיקה מותרת (בשונה מ-task_media).
create policy empdoc_select on employee_documents for select using (
  org_id in (select my_org_ids())
  and my_role(org_id) in ('admin', 'manager')
);

create policy empdoc_insert on employee_documents for insert with check (
  org_id in (select my_org_ids())
  and my_role(org_id) in ('admin', 'manager')
);

create policy empdoc_delete on employee_documents for delete using (
  org_id in (select my_org_ids())
  and my_role(org_id) in ('admin', 'manager')
);

-- ── Storage bucket ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('employee-docs', 'employee-docs', false)
on conflict (id) do nothing;

-- מנהלים בלבד: upload, download, delete
create policy empdocs_storage_select on storage.objects for select
  using (bucket_id = 'employee-docs' and (
    select my_role((string_to_array(name, '/'))[1]::uuid) in ('admin', 'manager')
  ));

create policy empdocs_storage_insert on storage.objects for insert
  with check (bucket_id = 'employee-docs' and (
    select my_role((string_to_array(name, '/'))[1]::uuid) in ('admin', 'manager')
  ));

create policy empdocs_storage_delete on storage.objects for delete
  using (bucket_id = 'employee-docs' and (
    select my_role((string_to_array(name, '/'))[1]::uuid) in ('admin', 'manager')
  ));
