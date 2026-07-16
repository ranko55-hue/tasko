-- ============================================================
-- 003: לקוחות קצה (הלקוחות של כל ארגון)
-- טיוטה — שדות סופיים ייקבעו באפיון
-- ============================================================

create table public.clients (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  contact_name text,
  phone        text,
  email        text,
  address      text,
  notes        text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index idx_clients_org on public.clients(org_id);

alter table public.clients enable row level security;

-- כל חברי הארגון רואים את לקוחות הארגון (עובד צריך לדעת אצל מי המשימה)
create policy "members read org clients"
  on public.clients for select
  using (org_id = public.current_org_id());

-- ניהול לקוחות — מנהל בלבד
create policy "manager inserts clients"
  on public.clients for insert
  with check (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

create policy "manager updates clients"
  on public.clients for update
  using (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');

create policy "manager deletes clients"
  on public.clients for delete
  using (org_id = public.current_org_id() and public.current_role_in_org() = 'manager');
