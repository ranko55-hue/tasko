-- ============================================================
-- 001: ארגונים (הלקוחות של המערכת) + חבילות מנוי
-- טיוטה — לאישור סופי אחרי אפיון (docs/02-spec.md)
-- ============================================================

create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  plan        text not null default 'free'
              check (plan in ('free', 'basic', 'pro')),
  -- מגבלות לפי חבילה (ניתן לדריסה פר-ארגון)
  max_members integer not null default 2,
  max_open_tasks integer not null default 20,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- פונקציות עזר להרשאות — בסיס לכל מדיניות RLS בהמשך
-- ============================================================

-- הארגון של המשתמש המחובר
create or replace function public.current_org_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from public.org_members
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- התפקיד של המשתמש המחובר בארגון שלו
create or replace function public.current_role_in_org()
returns text
language sql stable security definer set search_path = public
as $$
  select role from public.org_members
  where user_id = auth.uid() and is_active = true
  limit 1;
$$;

-- מדיניות: חבר ארגון רואה את הארגון שלו בלבד
create policy "members read own org"
  on public.organizations for select
  using (id = public.current_org_id());

-- עדכון פרטי ארגון — מנהל בלבד
create policy "manager updates own org"
  on public.organizations for update
  using (id = public.current_org_id() and public.current_role_in_org() = 'manager');

-- הערה: יצירת ארגון חדש מתבצעת דרך Edge Function (service role),
-- כחלק מתהליך ההרשמה — לא ישירות מהלקוח.
