-- ============================================================
-- 001: Storage — task-media (מדיה בציר הזמן: תמונות והקלטות)
-- bucket פרטי; גישה רק לחברי הארגון לפי org_id בתחילת הנתיב.
-- מבנה נתיב: {org_id}/{task_id}/{uuid}.{ext}
-- הרצה חד-פעמית ב-Supabase SQL Editor.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('task-media', 'task-media', false)
on conflict (id) do nothing;

-- RLS על storage.objects מופעל כברירת מחדל ב-Supabase.

-- קריאה: חבר ארגון שה-org_id בתחילת הנתיב שייך לו (my_org_ids מ-000_init)
create policy "task-media read for org members"
  on storage.objects for select
  using (
    bucket_id = 'task-media'
    and (storage.foldername(name))[1]::uuid in (select public.my_org_ids())
  );

-- העלאה: אותה בדיקה
create policy "task-media insert for org members"
  on storage.objects for insert
  with check (
    bucket_id = 'task-media'
    and (storage.foldername(name))[1]::uuid in (select public.my_org_ids())
  );
