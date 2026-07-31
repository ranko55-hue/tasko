-- 012: קבצי פרויקט — לשונית "קבצים" בכרטיס הפרויקט, למנהלים בלבד.
--
-- שתי שכבות הגנה, שתיהן חובה:
--   1. storage.objects — מי יכול להעלות/לקרוא/למחוק את הקובץ עצמו.
--   2. project_files   — טבלת המטא-דאטה (שם הקובץ, מי העלה, מתי).
-- הסתרה ב-UI לבדה אינה הגנה: עובד שיפנה ישירות ל-API חייב לקבל ריק.
--
-- מבנה נתיב: {org_id}/{project_id}/{uuid}.{ext}
--   foldername(name)[1] = org_id
--   foldername(name)[2] = project_id
--
-- בשונה מ-task-media (מיגרציה 005) שהיא ראיה ולכן אינה נמחקת, קבצי פרויקט
-- הם חומר עבודה — ולכן כאן יש גם policy למחיקה.

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

-- ── בדיקת הרשאה אחת, משותפת לכל ה-policies ─────────────────────────────
create or replace function public.can_access_project_file(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.projects p
     where (storage.foldername(p_name))[1] ~ '^[0-9a-fA-F-]{36}$'
       and (storage.foldername(p_name))[2] ~ '^[0-9a-fA-F-]{36}$'
       and p.id     = ((storage.foldername(p_name))[2])::uuid
       and p.org_id = ((storage.foldername(p_name))[1])::uuid
       and p.org_id in (select public.my_org_ids())
       and public.my_role(p.org_id) in ('project_manager','work_manager')
  )
$$;

drop policy if exists "project-files select" on storage.objects;
create policy "project-files select"
  on storage.objects for select
  using (bucket_id = 'project-files' and public.can_access_project_file(name));

drop policy if exists "project-files insert" on storage.objects;
create policy "project-files insert"
  on storage.objects for insert
  with check (bucket_id = 'project-files' and public.can_access_project_file(name));

drop policy if exists "project-files delete" on storage.objects;
create policy "project-files delete"
  on storage.objects for delete
  using (bucket_id = 'project-files' and public.can_access_project_file(name));

-- ── טבלת המטא-דאטה ─────────────────────────────────────────────────────
create table if not exists project_files (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  path        text not null unique,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  uploaded_by uuid references org_members(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists project_files_project_idx on project_files (project_id);

alter table project_files enable row level security;

-- מנהלים בלבד — קריאה, הוספה ומחיקה. לעובד ולראש צוות אין policy כלל,
-- ולכן הם מקבלים רשימה ריקה גם אם יפנו ישירות ל-API.
drop policy if exists "project_files select" on project_files;
create policy "project_files select" on project_files for select
  using (
    org_id in (select public.my_org_ids())
    and public.my_role(org_id) in ('project_manager','work_manager')
  );

drop policy if exists "project_files insert" on project_files;
create policy "project_files insert" on project_files for insert
  with check (
    org_id in (select public.my_org_ids())
    and public.my_role(org_id) in ('project_manager','work_manager')
  );

drop policy if exists "project_files delete" on project_files;
create policy "project_files delete" on project_files for delete
  using (
    org_id in (select public.my_org_ids())
    and public.my_role(org_id) in ('project_manager','work_manager')
  );
