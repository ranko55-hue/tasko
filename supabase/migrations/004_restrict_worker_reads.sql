-- 004: צמצום קריאה לעובדים.
--
-- הרקע: ב-000 נקבעה "תבנית אחידה לישויות הארגון: חברים רואים; מנהלים כותבים".
-- ה-USING של cli_all / prj_all / doc_all בודק רק חברות בארגון ולא תפקיד, ולכן
-- עובד יכול לשלוף את כל הלקוחות, כל הפרויקטים, וכל מסמכי הכספים של הארגון.
-- ה-redirect בצד הלקוח הוא UX בלבד; זו האכיפה האמיתית.
--
-- עיקרון: עובד רואה לקוח/פרויקט רק אם הוא מופיע במשימה שהוקצתה לו —
-- הוא צריך לדעת אצל מי הוא עובד. כספים סגורים בפניו לחלוטין.

-- מזהי החבר הנוכחי (בדרך כלל אחד; unique(auth_user_id) ב-org_members)
create or replace function my_member_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select id from org_members where auth_user_id = auth.uid() and is_active
$$;

-- ── לקוחות ──────────────────────────────────────────────────────────────
drop policy if exists cli_all on clients;

create policy cli_select on clients for select using (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) in ('project_manager','work_manager')
    or exists (
      select 1 from tasks t
       where t.client_id = clients.id
         and (t.assignee_id in (select my_member_ids())
           or t.team_lead_id in (select my_member_ids()))
    )
  )
);

create policy cli_insert on clients for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy cli_update on clients for update
  using (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));

-- ── פרויקטים ────────────────────────────────────────────────────────────
drop policy if exists prj_all on projects;

create policy prj_select on projects for select using (
  org_id in (select my_org_ids())
  and (
    my_role(org_id) in ('project_manager','work_manager')
    or exists (
      select 1 from tasks t
       where t.project_id = projects.id
         and (t.assignee_id in (select my_member_ids())
           or t.team_lead_id in (select my_member_ids()))
    )
  )
);

create policy prj_insert on projects for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy prj_update on projects for update
  using (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));

-- ── מסמכי כספים — מנהלים בלבד, גם בקריאה ────────────────────────────────
drop policy if exists doc_all on client_documents;

create policy doc_select on client_documents for select using (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy doc_insert on client_documents for insert with check (
  org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));
create policy doc_update on client_documents for update
  using (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'))
  with check (org_id in (select my_org_ids()) and my_role(org_id) in ('project_manager','work_manager'));

-- אינדקסים לתמיכה ב-EXISTS שלמעלה
create index if not exists tasks_assignee_id_idx on tasks (assignee_id);
create index if not exists tasks_team_lead_id_idx on tasks (team_lead_id);
