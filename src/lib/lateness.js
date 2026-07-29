import { deadlineOf } from './taskDates';
// חישוב איחור — מקור אמת יחיד.
// הצ'יפ "N באיחור" בשורת התדריך, המיון, התגים והקבוצה בתצוגת השורות —
// כולם נגזרים מכאן ולא מחישוב מקומי בשום רכיב.
//
// המועד הוא תאריך הסיום + שעת היעד (מיגרציה 009). deadlineOf מחזיר את
// due_at, שהטריגר בשרת גוזר בדיוק משני אלה.

const CLOSED = ['done', 'cancelled'];

// null = לא באיחור · 'unassigned' = חמור · 'working' = קל
export function lateness(task, now = new Date()) {
  if (!task || CLOSED.includes(task.status)) return null;
  const deadline = deadlineOf(task);
  if (!deadline || new Date(deadline) >= now) return null;
  return task.assignee_id ? 'working' : 'unassigned';
}

export function isLate(task, now) {
  return lateness(task, now) !== null;
}

export function lateCount(tasks, now) {
  return (tasks ?? []).filter((t) => isLate(t, now)).length;
}

// "לא הוקצתה" חמורה מ"בעבודה"
const RANK = { unassigned: 0, working: 1 };

// באיחור לראש; בתוך האיחור — החמור קודם, ובתוך אותה דרגה הוותיק קודם.
export function sortByUrgency(tasks, now = new Date()) {
  return [...(tasks ?? [])].sort((a, b) => {
    const la = lateness(a, now);
    const lb = lateness(b, now);
    if (la && lb) {
      const r = RANK[la] - RANK[lb];
      if (r !== 0) return r;
      return new Date(deadlineOf(a)) - new Date(deadlineOf(b));
    }
    if (la) return -1;
    if (lb) return 1;
    // שאר המשימות לפי מועד; משימה בלי מועד יורדת לסוף
    const da = deadlineOf(a) ? new Date(deadlineOf(a)) : Infinity;
    const db = deadlineOf(b) ? new Date(deadlineOf(b)) : Infinity;
    return da - db;
  });
}
