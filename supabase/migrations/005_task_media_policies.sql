-- 005: הידוק מדיניות ה-Storage של task-media, בהלימה ל-004.
--
-- הרקע: המדיניות מ-001 בדקה רק את ה-org_id בתחילת הנתיב, ולכן כל חבר ארגון
-- יכול היה לקרוא (ולהעלות) מדיה של כל משימה בארגון — כולל משימות שלא הוקצו לו.
-- כאן הגישה נקשרת למשימה עצמה: מנהל רואה הכול, עובד/ראש צוות רק את שלו.
--
-- מבנה נתיב: {org_id}/{task_id}/{uuid}.{ext}
--   foldername(name)[1] = org_id
--   foldername(name)[2] = task_id
--
-- אידמפוטנטי: כל create policy מקדים לו drop policy if exists.

-- האם למשתמש הנוכחי יש גישה למדיה של הנתיב הזה
create or replace function public.can_access_task_media(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.tasks t
     where (storage.foldername(p_name))[1] ~ '^[0-9a-fA-F-]{36}$'
       and (storage.foldername(p_name))[2] ~ '^[0-9]+$'
       and t.id = ((storage.foldername(p_name))[2])::bigint
       and t.org_id = ((storage.foldername(p_name))[1])::uuid
       and t.org_id in (select public.my_org_ids())
       and (
         public.my_role(t.org_id) in ('project_manager','work_manager')
         or t.assignee_id in (select public.my_member_ids())
         or t.team_lead_id in (select public.my_member_ids())
       )
  )
$$;

-- ── קריאה ───────────────────────────────────────────────────────────────
drop policy if exists "task-media read for org members" on storage.objects;
drop policy if exists "task-media select" on storage.objects;
create policy "task-media select"
  on storage.objects for select
  using (bucket_id = 'task-media' and public.can_access_task_media(name));

-- ── העלאה ───────────────────────────────────────────────────────────────
drop policy if exists "task-media insert for org members" on storage.objects;
drop policy if exists "task-media insert" on storage.objects;
create policy "task-media insert"
  on storage.objects for insert
  with check (bucket_id = 'task-media' and public.can_access_task_media(name));

-- אין policy ל-update או ל-delete: מדיה בציר הזמן היא ראיה, לא נמחקת ולא מוחלפת.
