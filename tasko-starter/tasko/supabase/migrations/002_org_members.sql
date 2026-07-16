-- ============================================================
-- 002: חברי ארגון + תפקידים (מנהל / עובד)
-- טיוטה — לאישור סופי אחרי אפיון
-- ============================================================

create table public.org_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'worker'
              check (role in ('manager', 'worker')),
  full_name   text not null,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (org_id, user_id)
);

create index idx_org_members_user on public.org_members(user_id);
create index idx_org_members_org  on public.org_members(org_id);

alter table public.org_members enable row level security;

-- כל חבר ארגון רואה את שאר חברי הארגון שלו (נדרש להקצאת משימות)
create policy "members read own org members"
  on public.org_members for select
  using (org_id = public.current_org_id());

-- הוספה / עדכון / השבתה של חברים — מנהל בלבד
create policy "manager inserts members"
  on public.org_members for insert
  with check (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

create policy "manager updates members"
  on public.org_members for update
  using (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

-- ============================================================
-- אכיפת מגבלת משתמשים לפי חבילה (תבנית מוכחת מפרויקט קודם)
-- ============================================================
create or replace function public.enforce_member_limit()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  member_count integer;
  org_limit    integer;
begin
  select count(*) into member_count
  from public.org_members
  where org_id = new.org_id and is_active = true;

  select max_members into org_limit
  from public.organizations where id = new.org_id;

  if member_count >= org_limit then
    raise exception 'הגעתם למגבלת המשתמשים בחבילה הנוכחית';
  end if;
  return new;
end;
$$;

create trigger trg_enforce_member_limit
  before insert on public.org_members
  for each row execute function public.enforce_member_limit();
