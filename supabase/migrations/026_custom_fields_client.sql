-- 026: הרחבת מנוע השדות המותאמים לישות 'client'.
--
-- אותו מנוע של פאזה 1 (024): אותם סוגים, אותה הרשאה פר-שדה, אותה תבנית RLS
-- מדורגת. כאן רק מרחיבים את רשימת הישויות המותרות ומוסיפים ענף client
-- ל-RLS של הערכים — כפוף ל-RLS הלקוחות הקיים (עובד מגיע רק ללקוחות ממשימותיו).

-- ══ 1. הרחבת ה-CHECK ═════════════════════════════════════════════════════
alter table custom_field_defs drop constraint custom_field_defs_entity_check;
alter table custom_field_defs add constraint custom_field_defs_entity_check
  check (entity in ('task', 'project', 'client'));

alter table custom_field_values drop constraint custom_field_values_entity_type_check;
alter table custom_field_values add constraint custom_field_values_entity_type_check
  check (entity_type in ('task', 'project', 'client'));

-- ══ 2. RLS של הערכים — הוספת ענף client ══════════════════════════════════
-- ה-exists על clients נאכף דרך RLS הלקוחות (cli_select) — לכן ערך נראה/ניתן
-- לכתיבה רק ללקוח שהמשתמש רשאי לראות.
drop policy cfv_select on custom_field_values;
create policy cfv_select on custom_field_values for select
  using (
    org_id in (select my_org_ids())
    and exists (select 1 from custom_field_defs d where d.id = field_id)
    and (
      (entity_type = 'task'    and exists (select 1 from tasks t    where t.id::text = entity_id))
      or (entity_type = 'project' and exists (select 1 from projects p where p.id::text = entity_id))
      or (entity_type = 'client'  and exists (select 1 from clients c  where c.id::text = entity_id))
    )
  );

drop policy cfv_insert on custom_field_values;
create policy cfv_insert on custom_field_values for insert
  with check (
    org_id in (select my_org_ids())
    and exists (select 1 from custom_field_defs d where d.id = field_id)
    and (
      (entity_type = 'task'    and exists (select 1 from tasks t    where t.id::text = entity_id))
      or (entity_type = 'project' and exists (select 1 from projects p where p.id::text = entity_id))
      or (entity_type = 'client'  and exists (select 1 from clients c  where c.id::text = entity_id))
    )
  );

-- הטריגר validate_custom_field_value כבר גנרי (בודק entity_type=def.entity +
-- ולידציית number/select) — אין צורך בשינוי עבור client.
