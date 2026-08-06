-- 029: דיווח נוכחות (ימים) — ציר נפרד מזמן העבודה על משימות.
--
-- רשומה אחת לעובד ליום. עובד מדווח/רואה רק את עצמו; מנהל ומעלה רואים את כולם.
-- אישורי מחלה ב-bucket פרטי (attendance-notes), נגישים למנהל ומעלה + לעובד עצמו.

create type attendance_type as enum ('work', 'vacation', 'sick');

create table attendance_entries (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations(id) on delete cascade,
  member_id       uuid not null references org_members(id)   on delete cascade,
  date            date not null,
  type            attendance_type not null,
  note            text,
  attachment_path text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, member_id, date)
);
create index on attendance_entries (org_id, date);
create index on attendance_entries (member_id, date);

alter table attendance_entries enable row level security;

-- קריאה: מנהל ומעלה רואה את כל הארגון; עובד רק את עצמו.
create policy att_select on attendance_entries for select using (
  org_id in (select my_org_ids()) and (
    my_role(org_id) in ('admin', 'manager')
    or member_id in (select id from org_members where auth_user_id = auth.uid())
  )
);
-- כתיבה/עדכון/מחיקה: העובד על עצמו בלבד (מנהל מדווח רק על עצמו כעובד).
create policy att_insert on attendance_entries for insert with check (
  org_id in (select my_org_ids())
  and member_id in (select id from org_members where auth_user_id = auth.uid())
);
create policy att_update on attendance_entries for update using (
  member_id in (select id from org_members where auth_user_id = auth.uid())
) with check (
  member_id in (select id from org_members where auth_user_id = auth.uid())
);
create policy att_delete on attendance_entries for delete using (
  member_id in (select id from org_members where auth_user_id = auth.uid())
);

-- ── Storage: אישורי מחלה ─────────────────────────────────────────────────
-- נתיב: orgId/memberId/uuid.ext — הרשאה למנהל ומעלה או לעובד עצמו.
insert into storage.buckets (id, name, public)
values ('attendance-notes', 'attendance-notes', false)
on conflict (id) do nothing;

create or replace function can_access_attendance_note(p_name text)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from org_members m
    where m.auth_user_id = auth.uid()
      and m.org_id = (string_to_array(p_name, '/'))[1]::uuid
      and (
        m.role in ('admin', 'manager')
        or m.id = (string_to_array(p_name, '/'))[2]::uuid
      )
  )
$$;

create policy attnote_select on storage.objects for select
  using (bucket_id = 'attendance-notes' and can_access_attendance_note(name));
create policy attnote_insert on storage.objects for insert
  with check (bucket_id = 'attendance-notes' and can_access_attendance_note(name));
create policy attnote_delete on storage.objects for delete
  using (bucket_id = 'attendance-notes' and can_access_attendance_note(name));
