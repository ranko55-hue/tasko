-- 016: שלב ג של "המבנה הארגוני" — בניית טיפוס התפקידים מחדש וכתיבת RLS מלא.
--
-- ⚠️ זו המיגרציה המסוכנת בבלוק: היא מפילה את כל 27 ה-policies ובונה אותם
-- מחדש. הסדר קריטי — policies תלויים ב-my_role, my_role תלוי בטיפוס,
-- והטיפוס תלוי בעמודה. לכן: policies → my_role → טיפוס → הכל בחזרה.
--
-- מודל הנראות:
--   admin   — כל הארגון.
--   manager — רק לקוחות שהוקצו לו ב-client_managers, הפרויקטים והמשימות
--             שתחתם, והעובדים שהוקצו לו ב-manager_id.
--   worker  — רק המשימות שהוא ה-assignee או ה-team_lead שלהן, והלקוח/
--             פרויקט שמאחוריהן (נדרש לשורת המשנה במסך "המשימות שלי").
--
-- עובד ללא manager_id אינו נראה לאף manager — כלומר כפוף ל-admin בלבד,
-- בדיוק כנדרש. אין צורך בערך מיוחד: היעדר ההקצאה הוא ההקצאה.

-- ══ 1. הפלת כל ה-policies ═══════════════════════════════════════════════
drop policy if exists org_select  on organizations;
drop policy if exists org_update  on organizations;
drop policy if exists mem_select  on org_members;
drop policy if exists mem_insert  on org_members;
drop policy if exists mem_update  on org_members;
drop policy if exists cli_select  on clients;
drop policy if exists cli_insert  on clients;
drop policy if exists cli_update  on clients;
drop policy if exists prj_select  on projects;
drop policy if exists prj_insert  on projects;
drop policy if exists prj_update  on projects;
drop policy if exists task_select     on tasks;
drop policy if exists task_update     on tasks;
drop policy if exists task_write_mgr  on tasks;
drop policy if exists ev_select on task_events;
drop policy if exists ev_insert on task_events;
drop policy if exists doc_select on client_documents;
drop policy if exists doc_insert on client_documents;
drop policy if exists doc_update on client_documents;
drop policy if exists sr_select on service_requests;
drop policy if exists sr_update on service_requests;
drop policy if exists "project_files select" on project_files;
drop policy if exists "project_files insert" on project_files;
drop policy if exists "project_files delete" on project_files;
drop policy if exists cm_select on client_managers;
drop policy if exists cm_insert on client_managers;
drop policy if exists cm_delete on client_managers;

-- ══ 2. בניית הטיפוס מחדש — שלושה ערכים בלבד ════════════════════════════
alter table org_members drop constraint if exists org_members_role_valid;
alter table org_members alter column role drop default;
drop function if exists my_role(uuid);

alter type member_role rename to member_role_old;
create type member_role as enum ('admin','manager','worker');

alter table org_members
  alter column role type member_role using role::text::member_role;

alter table org_members alter column role set default 'worker'::member_role;
drop type member_role_old;

-- ══ 3. פונקציות עזר ════════════════════════════════════════════════════
create or replace function my_role(p_org uuid)
returns member_role language sql stable security definer set search_path = public as $$
  select role from org_members
   where auth_user_id = auth.uid() and org_id = p_org and is_active limit 1
$$;

-- הלקוחות שהמשתמש הנוכחי רשאי לראות כ-admin או כ-manager מוקצה.
-- security definer: אחרת הקריאה ל-clients מתוך policy של clients הייתה
-- רקורסיבית. העובד אינו מקבל לקוחות דרך כאן אלא דרך המשימות שלו.
create or replace function my_client_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select c.id
    from clients c
   where c.org_id in (select my_org_ids())
     and (
       my_role(c.org_id) = 'admin'
       or exists (
         select 1 from client_managers cm
          where cm.client_id = c.id
            and cm.member_id in (select my_member_ids())
       )
     )
$$;

-- ══ 4. ארגון ═══════════════════════════════════════════════════════════
create policy org_select on organizations for select
  using (id in (select my_org_ids()));

-- ⚠️ נשמר כפי שהיה (admin+manager) בכוונה — שינוי להרשאת admin בלבד הוא
-- שינוי התנהגות שלא נתבקש, ומסך ההגדרות פתוח היום לשני התפקידים.
create policy org_update on organizations for update
  using      (id in (select my_org_ids()) and my_role(id) in ('admin','manager'))
  with check (id in (select my_org_ids()) and my_role(id) in ('admin','manager'));

-- ══ 5. חברי ארגון ══════════════════════════════════════════════════════
-- admin רואה את כולם; manager רואה את עצמו ואת מי שהוקצה לו; worker רק את עצמו.
create policy mem_select on org_members for select
  using (
    org_id in (select my_org_ids())
    and (
      my_role(org_id) = 'admin'
      or auth_user_id = auth.uid()
      or manager_id in (select my_member_ids())
    )
  );

-- ניהול חברים הוא פעולה של admin בלבד (תפקידים והקצאות).
create policy mem_insert on org_members for insert
  with check (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

create policy mem_update on org_members for update
  using (
    org_id in (select my_org_ids())
    and (my_role(org_id) = 'admin' or auth_user_id = auth.uid())
  );

-- ══ 6. לקוחות ══════════════════════════════════════════════════════════
create policy cli_select on clients for select
  using (
    org_id in (select my_org_ids())
    and (
      id in (select my_client_ids())
      or exists (
        select 1 from tasks t
         where t.client_id = clients.id
           and (t.assignee_id in (select my_member_ids())
             or t.team_lead_id in (select my_member_ids()))
      )
    )
  );

create policy cli_insert on clients for insert
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('admin','manager'));

create policy cli_update on clients for update
  using      (org_id in (select my_org_ids()) and id in (select my_client_ids()))
  with check (org_id in (select my_org_ids()) and id in (select my_client_ids()));

-- ══ 7. פרויקטים ════════════════════════════════════════════════════════
create policy prj_select on projects for select
  using (
    org_id in (select my_org_ids())
    and (
      client_id in (select my_client_ids())
      or exists (
        select 1 from tasks t
         where t.project_id = projects.id
           and (t.assignee_id in (select my_member_ids())
             or t.team_lead_id in (select my_member_ids()))
      )
    )
  );

create policy prj_insert on projects for insert
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

create policy prj_update on projects for update
  using      (org_id in (select my_org_ids()) and client_id in (select my_client_ids()))
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

-- ══ 8. משימות ══════════════════════════════════════════════════════════
create policy task_select on tasks for select
  using (
    org_id in (select my_org_ids())
    and (
      client_id in (select my_client_ids())
      or assignee_id  in (select my_member_ids())
      or team_lead_id in (select my_member_ids())
    )
  );

create policy task_write_mgr on tasks for insert
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

-- העובד מעדכן את המשימה שלו (התחל/סיים/השהה) — הטריגר
-- tasks_guard_manager_edit חוסם ממנו עריכת שדות ניהוליים.
create policy task_update on tasks for update
  using (
    org_id in (select my_org_ids())
    and (
      client_id in (select my_client_ids())
      or assignee_id  in (select my_member_ids())
      or team_lead_id in (select my_member_ids())
    )
  );

-- ══ 9. ציר הזמן ════════════════════════════════════════════════════════
-- נגזר ממשימות: תת-השאילתה על tasks נאכפת ב-RLS של tasks עצמה, ולכן
-- אין כאן שכפול של הלוגיקה ואין סיכון לסטייה בין השניים.
-- (קודם היה org-wide — כל חבר ארגון קרא את כל האירועים.)
create policy ev_select on task_events for select
  using (exists (select 1 from tasks t where t.id = task_events.task_id));

create policy ev_insert on task_events for insert
  with check (exists (select 1 from tasks t where t.id = task_events.task_id));

-- ══ 10. מסמכי לקוח ═════════════════════════════════════════════════════
create policy doc_select on client_documents for select
  using (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

create policy doc_insert on client_documents for insert
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

create policy doc_update on client_documents for update
  using      (org_id in (select my_org_ids()) and client_id in (select my_client_ids()))
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

-- ══ 11. קריאות שירות ═══════════════════════════════════════════════════
create policy sr_select on service_requests for select
  using (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

create policy sr_update on service_requests for update
  using      (org_id in (select my_org_ids()) and client_id in (select my_client_ids()))
  with check (org_id in (select my_org_ids()) and client_id in (select my_client_ids()));

-- ══ 12. קבצי פרויקט ════════════════════════════════════════════════════
create policy "project_files select" on project_files for select
  using (
    org_id in (select my_org_ids())
    and exists (select 1 from projects p
                 where p.id = project_files.project_id
                   and p.client_id in (select my_client_ids()))
  );

create policy "project_files insert" on project_files for insert
  with check (
    org_id in (select my_org_ids())
    and exists (select 1 from projects p
                 where p.id = project_files.project_id
                   and p.client_id in (select my_client_ids()))
  );

create policy "project_files delete" on project_files for delete
  using (
    org_id in (select my_org_ids())
    and exists (select 1 from projects p
                 where p.id = project_files.project_id
                   and p.client_id in (select my_client_ids()))
  );

-- ══ 13. הקצאות ═════════════════════════════════════════════════════════
-- קודם הייתה קריאה org-wide — כל חבר ארגון ראה את מפת ההקצאות כולה.
create policy cm_select on client_managers for select
  using (
    org_id in (select my_org_ids())
    and (my_role(org_id) = 'admin' or member_id in (select my_member_ids()))
  );

create policy cm_insert on client_managers for insert
  with check (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

create policy cm_delete on client_managers for delete
  using (org_id in (select my_org_ids()) and my_role(org_id) = 'admin');

-- ══ 14. שחזור ה-CHECK ══════════════════════════════════════════════════
alter table org_members add constraint org_members_role_valid
  check (role in ('admin','manager','worker'));
