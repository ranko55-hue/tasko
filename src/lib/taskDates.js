// חוק התאריכים של המשימה (מיגרציה 009).
//
// המשתמש מזין שלושה שדות: starts_on, ends_on, due_time.
// due_at אינו קלט — טריגר בשרת גוזר אותו מ-(ends_on + due_time) בשעון ישראל,
// והוא המועד היחיד שמשמש להשוואות ולשאילתות. לכן deadlineOf מחזיר אותו.
//
// משימה מרובת ימים אינה סוג נפרד — היא פשוט משימה ש-starts_on שונה מ-ends_on.

export function deadlineOf(task) {
  return task?.due_at ?? null;
}

export function isMultiDay(task) {
  if (!task?.starts_on || !task?.ends_on) return false;
  return task.starts_on !== task.ends_on;
}

// "22.7" — תאריך בפורמט קצר מתוך date (YYYY-MM-DD), בלי מעבר דרך timezone
function shortDate(ymd) {
  if (!ymd) return null;
  const [, m, d] = String(ymd).split('-');
  return `${Number(d)}.${Number(m)}`;
}

// טווח למשימה מרובת ימים, אחרת תאריך הסיום בלבד
export function dateRangeLabel(task) {
  if (!task?.ends_on) return null;
  return isMultiDay(task)
    ? `${shortDate(task.starts_on)} – ${shortDate(task.ends_on)}`
    : shortDate(task.ends_on);
}

// "16:00" — שעת היעד בלי השניות
export function dueTimeLabel(task) {
  if (!task?.due_time) return null;
  return String(task.due_time).slice(0, 5);
}

// ── המרות לטופס ───────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

export function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const DEFAULT_DUE_TIME = '23:59';

// ערכי ברירת מחדל לטופס: היום, היום, סוף היום
export function defaultDates() {
  const today = todayYmd();
  return { starts_on: today, ends_on: today, due_time: DEFAULT_DUE_TIME };
}

// הטופס לא מחייב אף שדה — ריק חוזר לברירת המחדל
export function datesFromForm({ startsOn, endsOn, dueTime }) {
  const today = todayYmd();
  const start = startsOn || today;
  // סיום לא יכול להקדים התחלה (אילוץ tasks_dates_order בשרת)
  const end = endsOn && endsOn >= start ? endsOn : start;
  return {
    starts_on: start,
    ends_on: end,
    due_time: dueTime || DEFAULT_DUE_TIME,
  };
}
