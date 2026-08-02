-- 021: פניות תמיכה — משתמש מארגון פותח פנייה, super-admin מטפל.
--
-- RLS: חבר ארגון יכול להוסיף פנייה בשם הארגון שלו ולקרוא את הפניות
--       שהוא עצמו פתח. שום משתמש ארגוני לא רואה פניות של ארגון אחר.
-- super-admin: קורא את כל הפניות דרך RPCs (security definer) בלבד.

-- ── טבלת support_tickets ──────────────────────────────────────────────
create table support_tickets (
  id          bigint generated always as identity primary key,
  org_id      uuid not null references organizations(id) on delete cascade,
  author_id   uuid not null references org_members(id) on delete cascade,
  subject     text not null check (length(subject) > 0),
  message     text not null check (length(message) > 0),
  status      text not null check (status in ('open','done')) default 'open',
  created_at  timestamptz not null default now()
);

create index idx_support_tickets_org on support_tickets(org_id);
create index idx_support_tickets_status on support_tickets(status);

alter table support_tickets enable row level security;

-- ── RLS policies ────────────────────────────────────────────────────────

-- חבר ארגון רואה רק את הפניות שהוא עצמו פתח
create policy support_tickets_select on support_tickets
  for select using (author_id in (select my_member_ids()));

-- חבר ארגון מוסיף פנייה רק בשם הארגון שלו
create policy support_tickets_insert on support_tickets
  for insert with check (org_id in (select my_org_ids()));

-- אין UPDATE/DELETE ישיר — שינוי סטטוס רק דרך RPC של super-admin.

-- ── RPCs עבור super-admin ───────────────────────────────────────────────

-- רשימת כל הפניות (חוצת ארגונים)
create or replace function platform_list_tickets()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    raise exception 'forbidden';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(t) order by t.created_at desc)
    from (
      select
        st.id,
        st.org_id,
        o.name as org_name,
        st.author_id,
        m.full_name as author_name,
        m.email as author_email,
        st.subject,
        st.message,
        st.status,
        st.created_at
      from support_tickets st
      join organizations o on o.id = st.org_id
      join org_members m on m.id = st.author_id
    ) t
  ), '[]'::jsonb);
end $$;

-- שינוי סטטוס פנייה
create or replace function platform_set_ticket_status(p_id bigint, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    raise exception 'forbidden';
  end if;

  if p_status not in ('open', 'done') then
    raise exception 'invalid_status';
  end if;

  update support_tickets set status = p_status where id = p_id;
end $$;

-- ספירת פניות פתוחות (למונה בניווט)
create or replace function platform_open_ticket_count()
returns bigint language sql stable security definer set search_path = public as $$
  select case when is_platform_admin()
    then (select count(*) from support_tickets where status = 'open')
    else 0
  end
$$;
