# Tasko

מערכת ניהול משימות ושירות — חברה מול לקוחות, לתחומי התעשייה והשירותים.

## סטטוס

🟡 **שלב 0 — הקמה ואפיון.** טרם החל פיתוח. ראו `docs/01-planning.md`.

## ארכיטקטורה

| שכבה | טכנולוגיה |
|---|---|
| ממשק | React (עברית, RTL) |
| בסיס נתונים + Auth | Supabase (PostgreSQL + RLS) |
| לוגיקה בצד שרת | Supabase Edge Functions |
| אירוח | Vercel (פריסה אוטומטית מ-GitHub) |

## שיטת עבודה — הכל בענן

אין עבודה מקומית. כל שינוי מתבצע כך:

1. **קוד:** עריכה/הוספת קבצים דרך ממשק GitHub בדפדפן (`.` בתוך ה-repo פותח עורך מלא — github.dev)
2. **SQL:** הדבקה ב-Supabase SQL Editor, ושמירת עותק כקובץ מיגרציה ב-`supabase/migrations/`
3. **פריסה:** Vercel מזהה כל commit ל-main ומעלה לאוויר אוטומטית
4. **החלטות:** כל החלטה מהותית נרשמת ב-`docs/03-decisions.md`

## מבנה התיקיות

```
docs/          מסמכי תכנון, אפיון ויומן החלטות
supabase/
  migrations/  קבצי SQL ממוספרים — המקור האמין של הסכמה
  functions/   Edge Functions
src/
  components/  רכיבי React (רכיב = קובץ, עד ~300 שורות)
  pages/       מסכים ראשיים
  hooks/       לוגיקת נתונים (useTasks, useOrg...)
  lib/         חיבור Supabase, קבועים
  locales/     כל הטקסטים בעברית — במקום אחד
```

## כללי עבודה

ראו `CONVENTIONS.md` — קריאה חובה לפני כל שינוי.
