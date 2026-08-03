-- 025: שדות אישור חריגה — מאפשר למנהל לאשר חריגה פעילה (אדום→אפור)
alter table tasks
  add column overrun_acknowledged boolean not null default false,
  add column acknowledged_by uuid references org_members(id),
  add column acknowledged_at timestamptz;
