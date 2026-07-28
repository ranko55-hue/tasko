# CLAUDE.md — Tasko

מסמך הכוונה ל-Claude Code. נקרא בתחילת כל סשן. מסכם **מה המוצר, הסטאק, והכללים**.
המקור האמין המלא: `docs/` ו-`CONVENTIONS.md` (קריאת חובה). בכל סתירה — `CONVENTIONS.md` גובר.

---

## 1. המוצר

**Tasko** — מערכת ניהול משימות שטח לקבלנים ולתחומי שירות (חברה מול לקוחות הקצה שלה).

- **קהל היעד קובע הכל: אנשי שטח.** בתנועה, לפעמים עם כפפות, באור שמש, יד אחת פנויה. לא יושבים מול מסך במשרד.
- **Mobile-first.** מעצבים קודם לטלפון; המחשב מקבל בונוס.
- **מודל עסקי:** ארגונים (הלקוחות של Tasko). היררכיה: לקוח ← פרויקט ← משימה (אין משימות "באוויר").
- **תפקידים (היררכיה):** `project_manager` > `work_manager` > `team_lead` > `worker`. מנהלים (project/work) רואים הכל וכותבים; עובד/ראש צוות רואים משימות שהוקצו להם.
- **MVP בלבד כרגע.** אינטגרציות (חשבוניות, וואטסאפ, AI, offline, GPS) → שלב 2, מתועדות ב-`04-phase2-backlog.md`. לא בונים אותן.

## 2. הסטאק

| שכבה | טכנולוגיה |
|---|---|
| Build | **Vite** |
| ממשק | **React** + **react-router** |
| עיצוב | **Tailwind CSS** |
| פונט | **Heebo** |
| כיוון | **RTL מלא** (`dir="rtl"`, `lang="he"`) |
| DB + Auth | **Supabase** (PostgreSQL + RLS) — דרך `supabase-js` |
| לוגיקת שרת | **Supabase Edge Functions** (service role) |
| אירוח | **Vercel** (פריסה אוטומטית מ-main) |

**Production URL:** https://tasko-gamma.vercel.app (שמור כאן, לא tasko.vercel.app שהוא פרויקט אחר)

**סודות:** רק `.env.local` / Environment Variables. בקוד — אך ורק `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY` (ה-anon key מותר בלקוח; כל ההגנה על RLS). service_role לעולם לא בקוד לקוח.

## 3. מבנה תיקיות

```
src/
  pages/        מסכים ראשיים (route = עמוד)
  components/   רכיבי React (shared/ לרכיבים משותפים)
  hooks/        לוגיקת נתונים (useTasks, useOrg...) — לא ברכיבים
  lib/          supabase.js, קבועים, עזרים
  locales/      he.js — כל הטקסטים בעברית
supabase/
  migrations/   NNN_snake_case.sql — המקור האמין של הסכמה
  functions/    Edge Functions
docs/           אפיון, החלטות, עקרונות עיצוב
```

## 4. הכללים (החוק — אין יוצאים מהכלל)

1. **מקס ~300 שורות לקובץ.** גדל → מפצלים. אין "קובץ ענק אחד". לעולם.
2. **אף מחרוזת עברית בתוך רכיב.** הכל ב-`src/locales/he.js`, מפתחות תיאוריים (`auth.login`, לא `text1`).
3. **RTL + עברית** בכל מסך.
4. **רכיב = אחריות אחת.** טעינת נתונים רק דרך hooks, לא ברכיבים. רכיבים משותפים ב-`components/shared/` בלבד.
5. **שמות:** רכיב `PascalCase.jsx`, hook `useCamelCase.js`, עזר `camelCase.js`, מיגרציה `NNN_snake_case.sql`.
6. **מיגרציות:** ממוספרות ברצף; **לא עורכים מיגרציה שרצה** — מוסיפים חדשה. כל טבלה עם RLS מהרגע הראשון. ה-repo הוא מקור האמת.
7. **Git:** commit בעברית, נושא אחד לכל commit. פיצ'ר גדול → branch.
8. **החלטה מהותית** (ארכיטקטורה/עסק/עיצוב) → שורה ב-`docs/03-decisions.md`.

## 5. עקרונות עיצוב (מרן — כל מסך נמדד מולם)

> **`DESIGN.md` הוא חוקת העיצוב המחייבת** — טוקני צבע, חוקת הכפתורים, מצבי מסך, ואיסורים. קריאת חובה לפני כל מסך. מקור ההשראה: `tasko-demo.html`.


- כפתורים גדולים ≥48px, מרווחים נדיבים, ניגודיות גבוהה (אור שמש). אין אייקונים זעירים כפעולה ראשית.
- פעולות עובד מרכזיות = 1–2 לחיצות מקס.
- הסטטוס הוא שפת המערכת: צבע ייחודי ועקבי לכל סטטוס; מבט אחד = הבנת המצב.
- מעברים חלקים ומהירים; Optimistic UI (קודם מציגים, אז שומרים).
- שפה עיצובית 2026: פינות מעוגלות, צללים עדינים, אוויר. לא "טופס ממוחשב".

## 6. הסכמה הקיימת ב-Supabase (מיגרציה `000_init_v7.sql` — מקור אמת יחיד)

- `organizations` — id, name.
- `org_members` — org_id, `auth_user_id`→auth.users (null עד מימוש הזמנה), full_name, phone, role(`member_role` enum), `gender`(`m`/`f`), invite_token, is_active. `unique(auth_user_id)`.
- `clients` — לקוחות הקצה; כולל `service_slug` ייחודי לטופס קריאות שירות ציבורי.
- `projects` — לקוח ← פרויקט; `client_id` חובה.
- `tasks` — `id` bigint רץ (מספר משימה קריא), `project_id` **חובה**, status(`scheduled`/`pending`/`in_progress`/`paused`/`blocked`/`done`/`cancelled`), priority(`normal`/`urgent`), שדות זמן נטו/חריגה/צוות.
- `task_events` — ציר זמן חתום; לקריאה/הוספה בלבד.
- `client_documents`, `service_requests` — כספים MVP וקריאות שירות (שלב הבא, לא נבנה עכשיו).
- **פונקציות עזר ל-RLS:** `my_org_ids()`, `my_role(org_id)`.
- **⚠️ יצירת ארגון = RPC `create_organization(p_org_name, p_full_name, p_phone, p_gender)`** — פונקציית `security definer` שיוצרת org + `project_manager` ראשון באטומיות. הלקוח קורא `supabase.rpc('create_organization', {...})`. שגיאות אפשריות: `not_authenticated`, `invalid_org_name`, `already_member`.

## 7. סטטוס נוכחי

שלב 0 → תחילת פיתוח MVP. **היעד הראשון והיחיד כרגע: מסך התחברות + אשף הקמת ארגון.** בלי לרוץ קדימה — שום מסך/פיצ'ר נוסף בלי אישור.
