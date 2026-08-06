-- 030: הרחבת דיווח הנוכחות — שעות, טווח שעות, ודיווח מנהל עבור עובד.
--
-- start/end ריקים = יום מלא → hours נגזר משעות העבודה של הארגון (בצד הלקוח).
-- start/end מלאים = דיווח חלקי → hours לפי הטווח. reported_by = מי שדיווח
-- בפועל (מנהל שמתקן עבור עובד).

alter table attendance_entries
  add column if not exists start_time  time,
  add column if not exists end_time    time,
  add column if not exists hours       numeric(5, 2),
  add column if not exists reported_by uuid references org_members(id) on delete set null;

-- ── הרחבת RLS: מנהל ומעלה רשאי לכתוב/לתקן עבור עובדי הארגון ─────────────
drop policy att_insert on attendance_entries;
create policy att_insert on attendance_entries for insert with check (
  org_id in (select my_org_ids()) and (
    member_id in (select id from org_members where auth_user_id = auth.uid())
    or my_role(org_id) in ('admin', 'manager')
  )
);

drop policy att_update on attendance_entries;
create policy att_update on attendance_entries for update using (
  member_id in (select id from org_members where auth_user_id = auth.uid())
  or my_role(org_id) in ('admin', 'manager')
) with check (
  org_id in (select my_org_ids())
);

drop policy att_delete on attendance_entries;
create policy att_delete on attendance_entries for delete using (
  member_id in (select id from org_members where auth_user_id = auth.uid())
  or my_role(org_id) in ('admin', 'manager')
);
