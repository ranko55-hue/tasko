// חלוקת המשימות לטורי הקנבן + חישוב ה-KPI (פונקציה טהורה)
const ACTIVE = ['in_progress', 'paused', 'pending_approval'];
const ALL_STATUSES = [
  'scheduled', 'pending', 'in_progress', 'paused',
  'blocked', 'pending_approval', 'done',
];

// משימה בחריגה פעילה (נרשם overrun והיא עדיין בעבודה)
export function isOverrun(t) {
  return t.overrun_alerted && ACTIVE.includes(t.status);
}

// doneTodayIds מתקבל כ-Set, אבל מנורמל כאן כדי שקורא שמעביר מערך/undefined
// לא יפיל את הלוח כולו (‎.has is not a function‎).
function toIdSet(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

export function buildDashboard(tasks, doneTodayIds) {
  const cols = { waiting: [], working: [], alert: [], approval: [], done: [] };
  const workers = new Set();
  const doneIds = toIdSet(doneTodayIds);

  for (const t of tasks ?? []) {
    if (t.status === 'in_progress' && t.assignee_id) workers.add(t.assignee_id);

    if (t.status === 'done') {
      if (doneIds.has(t.id)) cols.done.push(t);
      continue;
    }
    if (t.status === 'cancelled') continue;

    if (t.status === 'pending_approval') { cols.approval.push(t); continue; }
    if (t.status === 'blocked' || isOverrun(t)) cols.alert.push(t);
    else if (ACTIVE.includes(t.status)) cols.working.push(t);
    else cols.waiting.push(t); // pending / scheduled
  }

  const open = cols.waiting.length + cols.working.length + cols.alert.length + cols.approval.length;
  const kpis = {
    open,
    inField: workers.size,
    alerts: cols.alert.length,
    doneToday: cols.done.length,
  };
  return { cols, kpis };
}

export function statusCounts(tasks, doneTodayIds) {
  const doneIds = toIdSet(doneTodayIds);
  const counts = {};
  for (const s of ALL_STATUSES) counts[s] = 0;
  for (const t of tasks ?? []) {
    if (t.status === 'cancelled') continue;
    if (t.status === 'done') {
      if (doneIds.has(t.id)) counts.done++;
      continue;
    }
    if (counts[t.status] !== undefined) counts[t.status]++;
  }
  return counts;
}

export function buildActionQueue(tasks, blockedReasons) {
  const items = [];
  for (const t of tasks ?? []) {
    if (t.status === 'cancelled' || t.status === 'done') continue;

    if (t.status === 'pending_approval') {
      items.push({ task: t, kind: 'approval' });
      continue;
    }
    if (t.status === 'blocked') {
      items.push({ task: t, kind: 'blocked', reason: blockedReasons?.[t.id] ?? '' });
      continue;
    }
    if (isOverrun(t) && !t.overrun_acknowledged) {
      items.push({ task: t, kind: 'overrun' });
      continue;
    }
  }
  return items;
}
