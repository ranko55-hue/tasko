// חלוקת המשימות לטורי הקנבן + חישוב ה-KPI (פונקציה טהורה)
const ACTIVE = ['in_progress', 'paused'];

// משימה בחריגה פעילה (נרשם overrun והיא עדיין בעבודה)
export function isOverrun(t) {
  return t.overrun_alerted && ACTIVE.includes(t.status);
}

export function buildDashboard(tasks, doneTodayIds) {
  const cols = { waiting: [], working: [], alert: [], done: [] };
  const workers = new Set();

  for (const t of tasks) {
    if (t.status === 'in_progress' && t.assignee_id) workers.add(t.assignee_id);

    if (t.status === 'done') {
      if (doneTodayIds.has(t.id)) cols.done.push(t);
      continue;
    }
    if (t.status === 'cancelled') continue;

    if (t.status === 'blocked' || isOverrun(t)) cols.alert.push(t);
    else if (ACTIVE.includes(t.status)) cols.working.push(t);
    else cols.waiting.push(t); // pending / scheduled
  }

  const open = cols.waiting.length + cols.working.length + cols.alert.length;
  const kpis = {
    open,
    inField: workers.size,
    alerts: cols.alert.length,
    doneToday: cols.done.length,
  };
  return { cols, kpis };
}
