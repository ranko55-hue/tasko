// חישוב איחור — מקור אמת יחיד.
// הצ'יפ "N באיחור" בשורת התדריך והמיון בלוח חייבים להסכים, ולכן שניהם
// נגזרים מכאן ולא מחישוב מקומי.

const CLOSED = ['done', 'cancelled'];

// null = לא באיחור · 'unassigned' = חמור · 'working' = קל
export function lateness(task, now = new Date()) {
  if (!task || CLOSED.includes(task.status)) return null;
  if (!task.due_at || new Date(task.due_at) >= now) return null;
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
      return new Date(a.due_at) - new Date(b.due_at);
    }
    if (la) return -1;
    if (lb) return 1;
    // שאר המשימות לפי יעד; משימה בלי יעד יורדת לסוף
    const da = a.due_at ? new Date(a.due_at) : Infinity;
    const db = b.due_at ? new Date(b.due_at) : Infinity;
    return da - db;
  });
}
