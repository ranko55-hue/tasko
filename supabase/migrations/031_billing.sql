-- 031: מנוע חיוב (פורט מפריליו — Cardcom V11), מותאם ל-Tasko: פר-ארגון,
-- תמחור פר-מושב (199 בסיס הכולל 2 משתמשים + 49 לכל עובד פעיל נוסף), ניסיון 7 יום.
--
-- כל הכתיבה למנוי/חשבוניות נעשית ב-service-role מה-Edge Functions; הלקוח קורא
-- בלבד (RLS: אדמין הארגון). המצב לנעילה נחשף לכל חבר דרך org_billing_status().

-- ══ מנוי + טוקן כרטיס ═════════════════════════════════════════════════════
create table subscriptions (
  org_id                   uuid primary key references organizations(id) on delete cascade,
  status                   text not null default 'trialing'
                           check (status in ('trialing','active','past_due','canceled','expired')),
  trial_ends_at            timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  canceled_at              timestamptz,
  data_purge_at            timestamptz,
  purged_at                timestamptz,
  charge_retries           int not null default 0,
  cardcom_customer_id      text,
  cardcom_token            text,
  cardcom_token_exp        date,
  card_last4               text,
  card_exp                 text,   -- MM/YY
  cardcom_low_profile_code text,
  last_charge_at           timestamptz,
  last_charge_status       text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on subscriptions (current_period_end, status);

-- ══ חשבוניות (מסמך חשבונאי פר חיוב — מיוצר ע"י Cardcom, נשמר כאן) ═════════
create table billing_invoices (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  invoice_number text not null unique,   -- Cardcom DocumentNumber (אידמפוטנטיות)
  invoice_url    text,
  amount         numeric(10,2) not null,
  seats          int,
  charged_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index on billing_invoices (org_id, charged_at desc);

alter table subscriptions   enable row level security;
alter table billing_invoices enable row level security;
-- אדמין הארגון בלבד רואה חיוב/כרטיס/חשבוניות. אין כתיבה מהלקוח.
create policy sub_select on subscriptions   for select using (my_role(org_id) = 'admin');
create policy inv_select on billing_invoices for select using (my_role(org_id) = 'admin');

-- ══ תמחור ═════════════════════════════════════════════════════════════════
create or replace function billing_seats(p_org uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from org_members where org_id = p_org and is_active
$$;
-- 199 בסיס (2 מושבים) + 49 לכל מושב פעיל מעבר לשניים.
create or replace function billing_amount(p_org uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select 199 + 49 * greatest(0, billing_seats(p_org) - 2)
$$;

-- ══ מצב חיוב לכל חבר (לנעילה) — בלי חשיפת כרטיס/פרטים רגישים ═══════════════
create or replace function org_billing_status()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_org uuid; v_sub subscriptions;
  v_period_over boolean; v_trial_over boolean; v_locked boolean;
begin
  select org_id into v_org from org_members where auth_user_id = auth.uid() and is_active limit 1;
  if v_org is null then return jsonb_build_object('known', false); end if;
  select * into v_sub from subscriptions where org_id = v_org;
  if v_sub.org_id is null then return jsonb_build_object('known', false, 'org_id', v_org); end if;

  v_period_over := v_sub.current_period_end is not null and v_sub.current_period_end <= now();
  v_trial_over  := v_sub.status = 'trialing' and v_sub.trial_ends_at is not null and v_sub.trial_ends_at <= now();
  v_locked := v_sub.status = 'expired'
              or (v_sub.status = 'canceled' and v_period_over)
              or v_trial_over;

  return jsonb_build_object(
    'known', true, 'status', v_sub.status, 'locked', v_locked,
    'trial_ends_at', v_sub.trial_ends_at, 'current_period_end', v_sub.current_period_end,
    'cancel_at_period_end', v_sub.cancel_at_period_end,
    'data_purge_at', v_sub.data_purge_at,
    'seats', billing_seats(v_org), 'next_amount', billing_amount(v_org),
    'is_admin', my_role(v_org) = 'admin'
  );
end $$;
grant execute on function org_billing_status() to authenticated;

-- ══ updated_at + זריעת מנוי-ניסיון בעת יצירת ארגון (7 יום) ════════════════
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger sub_touch before update on subscriptions
  for each row execute function touch_updated_at();

create or replace function seed_subscription_trg()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into subscriptions (org_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '7 days')
  on conflict (org_id) do nothing;
  return new;
end $$;
create trigger org_seed_subscription after insert on organizations
  for each row execute function seed_subscription_trg();

-- ארגונים קיימים — ניסיון חסד של 7 יום מעכשיו כדי להזין כרטיס.
insert into subscriptions (org_id, status, trial_ends_at)
select id, 'trialing', now() + interval '7 days' from organizations
on conflict (org_id) do nothing;

-- ══ מחיקת נתונים (ריטיינר) — כבוי כברירת מחדל; נקרא רק מהקרון כש-PURGE דלוק ═
create or replace function purge_org_data(p_org uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- מוחק נתוני עבודה בלבד; משאיר ארגון, חברים וחשבוניות.
  delete from meetings where org_id = p_org;
  delete from attendance_entries where org_id = p_org;
  delete from tasks where org_id = p_org;
  delete from projects where org_id = p_org;
  delete from clients where org_id = p_org;
end $$;
revoke all on function purge_org_data(uuid) from public, anon, authenticated;

-- ══ Super-admin: סטטוס חיוב פר ארגון + הארכת ניסיון ═══════════════════════
create or replace function platform_list_billing()
returns table(org_id uuid, name text, status text, trial_ends_at timestamptz,
              current_period_end timestamptz, seats int, next_amount numeric,
              last_charge_status text)
language sql stable security definer set search_path = public as $$
  select o.id, o.name, s.status, s.trial_ends_at, s.current_period_end,
         billing_seats(o.id), billing_amount(o.id), s.last_charge_status
  from organizations o
  left join subscriptions s on s.org_id = o.id
  where is_platform_admin()
  order by o.name
$$;
grant execute on function platform_list_billing() to authenticated;

create or replace function platform_extend_trial(p_org_id uuid, p_days int)
returns void language plpgsql security definer set search_path = public as $$
declare v_base timestamptz;
begin
  if not is_platform_admin() then raise exception 'not_platform_admin'; end if;
  if p_days not in (7, 14) then raise exception 'invalid_days'; end if;
  select greatest(coalesce(trial_ends_at, now()), now()) into v_base
    from subscriptions where org_id = p_org_id;
  update subscriptions
    set trial_ends_at = v_base + (p_days || ' days')::interval, status = 'trialing'
    where org_id = p_org_id;
end $$;
grant execute on function platform_extend_trial(uuid, int) to authenticated;
