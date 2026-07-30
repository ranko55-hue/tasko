-- 011: הוספת המספר הרץ ותאריך ההוספה ל-client_overview.
--
-- מיגרציה 010 הוסיפה clients.number, אבל מסך הלקוחות לא קורא את הטבלה אלא את
-- ה-view הזה, שרשימת העמודות שלו מפורשת — ולכן המספר לא הגיע ללקוח כלל והוצג
-- ריק. created_at נוסף באותה הזדמנות עבור "נוסף ב-..." בלשונית כללי.
--
-- גוף ה-view זהה למיגרציה 007 מילה במילה; רק שתי עמודות נוספו לרשימת ה-select.
-- security_invoker נשמר: ה-view נאכף לפי ה-RLS של הקורא, לא של היוצר.

drop view if exists client_overview;

create view client_overview
with (security_invoker = on) as
select
  c.id,
  c.org_id,
  c.number,
  c.name,
  c.contact_name,
  c.contact_phone,
  c.is_active,
  c.created_at,
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
