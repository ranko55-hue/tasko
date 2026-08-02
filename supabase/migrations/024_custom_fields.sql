-- 024: שדות מותאמים אישית — פאזה 1.
--
-- מודל EAV: טבלת הגדרות (custom_field_defs) + טבלת ערכים (custom_field_values).
-- אכיפת הרשאה פר-שדה ברמת הנתונים:
--   - ה-SELECT על defs מסונן לפי min_role → מי שמתחת לרמה לא רואה שהשדה קיים
--   - ה-SELECT על values חוסם דרך subquery על defs (שנאכפת ב-RLS שלה)
--   - כתיבה/עדכון חסומים באותו אופן
--
-- סוגי שדה: text, number, date, select (רשימת ערכים).
-- ישויות: task, project.

-- ══ 1. טיפוסים ═══════════════════════════════════════════════════════════

create type custom_field_type as enum ('text', 'number', 'date', 'select');
create type field_min_role as enum ('everyone', 'manager', 'admin');

-- ══ 2. פונקציית עזר — האם התפקיד עומד ברמה הנדרשת ════════════════════════

create or replace function role_gte(p_role member_role, p_min field_min_role)
returns boolean language sql immutable as $$
  select case p_min
    when 'everyone' then true
    when 'manager'  then p_role in ('admin','manager')
    when 'admin'    then p_role = 'admin'
  end
$$;

-- ══ 3. הגדרות שדה ════════════════════════════════════════════════════════

create table custom_field_defs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  entity      text not null check (entity in ('task', 'project')),
  field_type  custom_field_type not null,
  label       text not null,
  options     jsonb not null default '[]'::jsonb,
  is_required boolean not null default false,
  min_role    field_min_role not null default 'everyone',
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index on custom_field_defs (org_id, entity);

alter table custom_field_defs enable row level security;

-- SELECT: רק שדות שהתפקיד מרשה
create policy cfd_select on custom_field_defs for select
  using (
    org_id in (select my_org_ids())
    and role_gte(my_role(org_id), min_role)
  );

-- ניהול שדות: admin בלבד
create policy cfd_insert on custom_field_defs for insert
  with check (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

create policy cfd_update on custom_field_defs for update
  using      (org_id in (select my_org_ids()) and my_role(org_id) = 'admin')
  with check (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

create policy cfd_delete on custom_field_defs for delete
  using (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

-- ══ 4. ערכי שדה ══════════════════════════════════════════════════════════

create table custom_field_values (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  field_id    uuid not null references custom_field_defs(id) on delete cascade,
  entity_type text not null check (entity_type in ('task', 'project')),
  entity_id   text not null,
  value       text,
  created_at  timestamptz not null default now(),
  unique(field_id, entity_id)
);

create index on custom_field_values (org_id, entity_type, entity_id);

alter table custom_field_values enable row level security;

-- SELECT: רואה ערך רק אם (א) רואה את הגדרת השדה, (ב) רואה את הישות
create policy cfv_select on custom_field_values for select
  using (
    org_id in (select my_org_ids())
    and exists (select 1 from custom_field_defs d where d.id = field_id)
    and (
      (entity_type = 'task'    and exists (select 1 from tasks t    where t.id::text = entity_id))
      or
      (entity_type = 'project' and exists (select 1 from projects p where p.id::text = entity_id))
    )
  );

-- INSERT: אותם תנאים
create policy cfv_insert on custom_field_values for insert
  with check (
    org_id in (select my_org_ids())
    and exists (select 1 from custom_field_defs d where d.id = field_id)
    and (
      (entity_type = 'task'    and exists (select 1 from tasks t    where t.id::text = entity_id))
      or
      (entity_type = 'project' and exists (select 1 from projects p where p.id::text = entity_id))
    )
  );

-- UPDATE: רואה את השדה + חבר בארגון
create policy cfv_update on custom_field_values for update
  using (
    org_id in (select my_org_ids())
    and exists (select 1 from custom_field_defs d where d.id = field_id)
  );

-- DELETE: admin בלבד
create policy cfv_delete on custom_field_values for delete
  using (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

-- ══ 5. טריגר ולידציה ═════════════════════════════════════════════════════

create or replace function validate_custom_field_value()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_def record;
begin
  select * into v_def
    from custom_field_defs
   where id = new.field_id;

  if not found then
    raise exception 'field_not_found';
  end if;

  if new.entity_type != v_def.entity then
    raise exception 'entity_mismatch';
  end if;

  if v_def.field_type = 'number' and new.value is not null and new.value != '' then
    begin
      perform new.value::numeric;
    exception when others then
      raise exception 'invalid_number';
    end;
  end if;

  if v_def.field_type = 'select' and new.value is not null and new.value != '' then
    if not (v_def.options @> to_jsonb(new.value)) then
      raise exception 'invalid_option';
    end if;
  end if;

  return new;
end $$;

create trigger cfv_validate
  before insert or update on custom_field_values
  for each row execute function validate_custom_field_value();
