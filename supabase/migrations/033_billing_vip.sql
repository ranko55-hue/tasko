-- 033: סטטוס VIP — פטור מחיוב (פורט מפריליו). ארגון VIP מדולג ע"י BillingGate,
-- הקרון והנעילה; גישה מלאה ללא הגבלת זמן.

alter table subscriptions drop constraint subscriptions_status_check;
alter table subscriptions add constraint subscriptions_status_check
  check (status in ('trialing', 'active', 'past_due', 'canceled', 'expired', 'vip'));

-- יומן פעולות חיוב (VIP וכו') — service role בלבד.
create table if not exists billing_events (
  id            bigint generated always as identity primary key,
  org_id        uuid references organizations(id) on delete set null,
  actor_auth_id uuid,
  action        text not null,
  created_at    timestamptz not null default now()
);
alter table billing_events enable row level security;

-- Super-admin: סימון/ביטול VIP. ביטול מחזיר למסלול לפי המצב (פעיל/ניסיון/דרישת תשלום).
create or replace function platform_set_vip(p_org_id uuid, p_vip boolean)
returns void language plpgsql security definer set search_path = public as $$
declare v_sub subscriptions;
begin
  if not is_platform_admin() then raise exception 'not_platform_admin'; end if;
  if p_vip then
    update subscriptions set status = 'vip' where org_id = p_org_id;
  else
    select * into v_sub from subscriptions where org_id = p_org_id;
    update subscriptions set status = case
      when v_sub.current_period_end is not null and v_sub.current_period_end > now() then 'active'
      when v_sub.trial_ends_at is not null and v_sub.trial_ends_at > now() then 'trialing'
      else 'expired'
    end where org_id = p_org_id;
  end if;
  insert into billing_events (org_id, actor_auth_id, action)
  values (p_org_id, auth.uid(), case when p_vip then 'vip_on' else 'vip_off' end);
end $$;
grant execute on function platform_set_vip(uuid, boolean) to authenticated;

-- הארגונים של מפעילי הפלטפורמה (רן) — VIP אוטומטית אם אינם כבר פטורים.
update subscriptions s set status = 'vip'
where s.status <> 'vip'
  and s.org_id in (
    select distinct m.org_id from org_members m
    join platform_admins p on p.user_id = m.auth_user_id
  );
