-- 013: שלב א של "המבנה הארגוני" — שלושה תפקידים, וארכון במקום מחיקה קשה.
--
-- ── התפקידים ────────────────────────────────────────────────────────────
-- לפני: project_manager | work_manager | team_lead | worker
-- אחרי: admin (מנהל מערכת, רואה הכל) | manager (דרג ביניים) | worker
--
-- המיפוי:
--   project_manager → admin    (כולל בעלי הארגונים — create_organization
--                               תמיד יצר project_manager, ולכן כל בעלים
--                               הופך ל-admin אוטומטית)
--   work_manager    → manager
--   team_lead       → worker   (דגל ראש-הצוות יורד מההיררכיה)
--   worker          → worker
--
-- למה rename ולא טיפוס חדש: my_role() מחזיר member_role (טיפוס enum, לא
-- text), ולכן ה-policies משווים ערכי enum — הקבועים בהן נשמרים לפי OID
-- פנימי ולא לפי המחרוזת. שינוי שם התווית נגרר אליהם אוטומטית, וכל ~30
-- ה-policies הקיימים ממשיכים לעבוד בלי לגעת בהם. יצירת טיפוס חדש הייתה
-- מחייבת הפלה ובנייה מחדש של כולם — בדיוק מה שיקרה בשלב ג ממילא.
--
-- ⚠️ התווית 'team_lead' נשארת בטיפוס כשארית לא-בשימוש: אי אפשר
-- DROP VALUE מ-enum ב-PostgreSQL. חוסמים אותה בפועל ב-CHECK למטה, והיא
-- תיעלם כשנבנה את הטיפוס מחדש בשלב ג יחד עם כתיבת ה-RLS.
--
-- ⚠️ tasks.team_lead_id לא נמחק. זו הקצאה ברמת המשימה (מי מוביל אותה),
-- לא תפקיד של חבר, ויש בה נתונים בפועל. הסרתה תשבור את useMyTasks ואת
-- ה-policies שנשענים עליה, ולכן היא דורשת הכרעה נפרדת.

-- ── 1. מיפוי החברים (לפני שינוי התוויות) ───────────────────────────────
update org_members set role = 'worker' where role = 'team_lead';

-- ── 2. שינוי שמות התוויות ──────────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'member_role' and e.enumlabel = 'project_manager') then
    alter type member_role rename value 'project_manager' to 'admin';
  end if;
  if exists (select 1 from pg_enum e join pg_type t on t.oid = e.enumtypid
              where t.typname = 'member_role' and e.enumlabel = 'work_manager') then
    alter type member_role rename value 'work_manager' to 'manager';
  end if;
end $$;

-- ── 3. רשת ביטחון: לכל ארגון חייב להישאר לפחות admin אחד ───────────────
-- אם ארגון נשאר בלי admin (למשל ארגון שכל חבריו היו work_manager),
-- החבר הוותיק ביותר מקודם, אחרת אף אחד לא יוכל לנהל אותו.
do $$
declare
  v_org uuid;
begin
  for v_org in
    select o.id from organizations o
     where not exists (select 1 from org_members m
                        where m.org_id = o.id and m.role = 'admin' and m.is_active)
       and exists (select 1 from org_members m where m.org_id = o.id and m.is_active)
  loop
    update org_members
       set role = 'admin'
     where id = (select id from org_members
                  where org_id = v_org and is_active
                  order by created_at, id limit 1);
  end loop;
end $$;

-- ── 4. חסימת התווית שירדה ──────────────────────────────────────────────
alter table org_members drop constraint if exists org_members_role_valid;
alter table org_members add constraint org_members_role_valid
  check (role in ('admin','manager','worker'));

-- ── 5. ארכון במקום מחיקה קשה + מי יצר ─────────────────────────────────
-- מיגרציה 005 המקורית נדחתה; זה החוב שנסגר כאן.
alter table clients  add column if not exists created_by  uuid references org_members(id) on delete set null;
alter table clients  add column if not exists archived_at timestamptz;
alter table projects add column if not exists created_by  uuid references org_members(id) on delete set null;
alter table projects add column if not exists archived_at timestamptz;
alter table tasks    add column if not exists archived_at timestamptz;
-- tasks.created_by כבר קיים מ-000_init

-- אינדקסים חלקיים: הרשימות שואלות "לא מאורכב", והאינדקס החלקי קטן ומדויק
create index if not exists clients_active_idx  on clients  (org_id) where archived_at is null;
create index if not exists projects_active_idx on projects (org_id) where archived_at is null;
create index if not exists tasks_active_idx    on tasks    (org_id) where archived_at is null;
