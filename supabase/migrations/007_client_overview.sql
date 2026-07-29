-- 007: תצוגת סיכום ללקוחות — מונים בשאילתה אחת במקום שאילתה לכל לקוח.
--
-- security_invoker = on: ה-view נאכף לפי ה-RLS של המשתמש הקורא ולא של היוצר.
-- בלי זה, כל קורא היה מקבל את כל הארגונים. ב-Postgres 15+ (Supabase) זו ברירת
-- המחדל הנכונה לכל view מעל טבלאות עם RLS.

drop view if exists client_overview;

create view client_overview
with (security_invoker = on) as
select
  c.id,
  c.org_id,
  c.name,
  c.contact_name,
  c.contact_phone,
  c.is_active,
  coalesce(p.active_projects, 0)  as active_projects,
  coalesce(t.open_tasks, 0)       as open_tasks,
  coalesce(t.waiting_tasks, 0)    as waiting_tasks,
  coalesce(t.delayed_tasks, 0)    as delayed_tasks
from clients c
left join (
  select client_id, count(*) filter (where status = 'open') as active_projects
    from projects
   group by client_id
) p on p.client_id = c.id
left join (
  select
    client_id,
    count(*) filter (where status not in ('done','cancelled'))            as open_tasks,
    count(*) filter (where status in ('pending','scheduled'))             as waiting_tasks,
    count(*) filter (where status = 'blocked' or overrun_alerted)         as delayed_tasks
    from tasks
   group by client_id
) t on t.client_id = c.id;
