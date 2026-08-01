// חוק התאריכים של המשימה (מיגרציה 009 + 019).
//
// המשתמש מזין ארבעה שדות: starts_on, start_time, ends_on, due_time.
// בטופס הם מוצגים כשני שדות מורכבים: "התחלה" (תאריך+שעה) ו"סיום" (תאריך+שעה).
// due_at אינו קלט — טריגר בשרת גוזר אותו מ-(ends_on + due_time) בשעון ישראל,
// והוא המועד היחיד שמשמש להשוואות ולשאילתות. לכן deadlineOf מחזיר אותו.

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

export function nowHm() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const DEFAULT_DUE_TIME = '23:59';
export const DEFAULT_START_TIME = '08:00';

// הטופס מתחיל ריק — ברירות המחדל מוחלות רק בשליחה (datesFromForm).
export function defaultDates() {
  return { starts_on: '', start_time: '', ends_on: '', due_time: '' };
}

// הטופס לא מחייב אף שדה — ריק חוזר לברירת המחדל
export function datesFromForm({ startDate, startTime, endDate, endTime }) {
  const today = todayYmd();
  const now = nowHm();

  const sDate = startDate || today;
  const sTime = startTime || now;
  const eDate = endDate && endDate >= sDate ? endDate : sDate;
  const eTime = endTime || DEFAULT_DUE_TIME;

  return {
    starts_on: sDate,
    start_time: sTime,
    ends_on: eDate,
    due_time: eTime,
  };
}
