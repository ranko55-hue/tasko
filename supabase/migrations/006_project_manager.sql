-- 006: מנהל פרויקט על טבלת projects.
-- תאריך היעד כבר קיים כ-ends_at ולכן לא נדרש שינוי סכמה עבורו.
-- on delete set null: אם חבר הארגון מוסר, הפרויקט נשאר ומאבד רק את השיוך.

alter table projects
  add column if not exists manager_id uuid references org_members(id) on delete set null;

create index if not exists projects_manager_id_idx on projects (manager_id);
