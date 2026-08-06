-- 027: הזמנת עובדים בקישור + מנוע תבניות וואטסאפ (multi-tenant).
--
-- שני חלקים:
--   א. invites — טוקן הזמנה חד-פעמי לכל עובד; קבלת ההזמנה (יצירת חשבון auth
--      וקביעת סיסמה) נעשית ב-Edge Function עם service-role, לא דרך RLS.
--   ב. wa_settings + wa_templates — תבניות הודעות וואטסאפ לארגון, עד 15,
--      עם תבניות מערכת מובנות.

-- ══ א. הזמנות ═════════════════════════════════════════════════════════════
create table invites (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  org_member_id uuid not null references org_members(id)   on delete cascade,
  token         text not null unique,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now(),
  created_by    uuid references org_members(id) on delete set null
);
create index on invites (org_member_id, created_at desc);

alter table invites enable row level security;

-- קריאה/כתיבה מהלקוח: admin של הארגון בלבד (מסך הצוות admin-only ממילא).
-- אימות הטוקן הציבורי עצמו עובר דרך invite_info() ו-Edge Function.
create policy invites_select on invites for select using (my_role(org_id) = 'admin');
create policy invites_insert on invites for insert with check (my_role(org_id) = 'admin');
create policy invites_update on invites for update using (my_role(org_id) = 'admin');

-- מידע ציבורי מינימלי על הזמנה תקפה — לדף /welcome. security definer כדי
-- לעקוף RLS; מחזיר רק שם העובד ושם הארגון, ורק לטוקן שקיים.
create or replace function invite_info(p_token text)
returns table(full_name text, org_name text, valid boolean)
language sql security definer stable
set search_path = public
as $$
  select m.full_name, o.name,
         (i.used_at is null and i.expires_at > now()) as valid
  from invites i
  join org_members m  on m.id = i.org_member_id
  join organizations o on o.id = i.org_id
  where i.token = p_token
$$;
grant execute on function invite_info(text) to anon, authenticated;

-- ══ ב. הגדרות ותבניות וואטסאפ ═════════════════════════════════════════════
create table wa_settings (
  org_id     uuid primary key references organizations(id) on delete cascade,
  signature  text,
  updated_at timestamptz not null default now()
);
alter table wa_settings enable row level security;
create policy wa_settings_select on wa_settings for select
  using (org_id in (select my_org_ids()));
create policy wa_settings_write on wa_settings for all
  using (my_role(org_id) = 'admin') with check (my_role(org_id) = 'admin');

create table wa_templates (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  title      text not null,
  body       text not null,
  is_system  boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on wa_templates (org_id, sort_order, created_at);
alter table wa_templates enable row level security;
-- קריאה: כל חבר בארגון (שליחה מכל הקשר). כתיבה: admin בלבד.
create policy wa_templates_select on wa_templates for select
  using (org_id in (select my_org_ids()));
create policy wa_templates_write on wa_templates for all
  using (my_role(org_id) = 'admin') with check (my_role(org_id) = 'admin');

-- מקס 15 תבניות לארגון
create or replace function enforce_wa_template_limit()
returns trigger language plpgsql as $$
begin
  if (select count(*) from wa_templates where org_id = new.org_id) >= 15 then
    raise exception 'WA_TEMPLATE_LIMIT';
  end if;
  return new;
end $$;
create trigger wa_template_limit before insert on wa_templates
  for each row execute function enforce_wa_template_limit();

-- ── תבניות מערכת מובנות: נזרעות לכל ארגון חדש, וגם לארגונים הקיימים ──
create or replace function seed_wa_templates_for(p_org uuid)
returns void language plpgsql as $$
begin
  if not exists (select 1 from wa_templates where org_id = p_org and is_system and title = 'הזמנת עובד') then
    insert into wa_templates (org_id, title, body, is_system, sort_order) values
      (p_org, 'הזמנת עובד',
       'שלום {שם העובד}, נפתח לך חשבון במערכת Tasko של {שם הארגון}. להתחברות ראשונה וקביעת סיסמה: {קישור}',
       true, 0);
  end if;
  if not exists (select 1 from wa_templates where org_id = p_org and is_system and title = 'עדכון ללקוח') then
    insert into wa_templates (org_id, title, body, is_system, sort_order) values
      (p_org, 'עדכון ללקוח',
       'שלום {שם הלקוח}, יש עדכון בנוגע למשימה מספר {מספר משימה} — {שם משימה}.',
       true, 1);
  end if;
end $$;

create or replace function seed_wa_templates_trg()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  perform seed_wa_templates_for(new.id);
  return new;
end $$;
create trigger org_seed_wa after insert on organizations
  for each row execute function seed_wa_templates_trg();

-- זריעה לארגונים קיימים
do $$
declare o record;
begin
  for o in select id from organizations loop
    perform seed_wa_templates_for(o.id);
  end loop;
end $$;
