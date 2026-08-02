-- 020: שכבת super-admin — מפעיל הפלטפורמה.
--
-- מעל ההיררכיה הארגונית (admin/manager/worker), קיים תפקיד פלטפורמה
-- שנזרע ידנית בטבלה — אין דרך UI להפוך מישהו ל-super-admin.
-- כל הגישה חוצת-ארגונים עוברת דרך security definer RPCs בלבד;
-- אף RLS policy ארגוני קיים לא נוגע.

-- ── טבלת platform_admins ──────────────────────────────────────────────
create table platform_admins (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  role      text not null check (role in ('owner','admin')) default 'admin',
  added_at  timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- admins רואים את הטבלה רק דרך RPCs; אין SELECT policy ישירה.
-- אין INSERT/UPDATE/DELETE policies — כתיבה רק ידנית ב-SQL.

-- ── פונקצית עזר ────────────────────────────────────────────────────────
create or replace function is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from platform_admins where user_id = auth.uid())
$$;

-- ── seed: הבעלים הראשון ─────────────────────────────────────────────
insert into platform_admins (user_id, role)
values ('364edaa4-bb13-4709-b971-9b73ca8b9ce0', 'owner')
on conflict (user_id) do nothing;
