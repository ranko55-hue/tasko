// עזרי ציר-זמן (גאנט) — פריסת משימות/פגישות לבלוקים על ציר זמן.
// צבע הבלוק לפי סטטוס (אותו קידוד צבע כמו StatusPill/DESIGN).

import { deadlineOf } from './taskDates';
import { lateness } from './lateness';

// רקע+טקסט לכל סטטוס. צהוב/אפור בהיר → טקסט navy לניגודיות.
export const STATUS_BLOCK = {
  pending: 'bg-grayLight text-white',
  scheduled: 'bg-statusBlue text-white',
  in_progress: 'bg-statusGreen text-white',
  paused: 'bg-brandYellow text-navy',
  blocked: 'bg-statusRed text-white',
  pending_approval: 'bg-purple-500 text-white',
  done: 'bg-line text-grayMid',
  cancelled: 'bg-line text-grayMid',
};

export const MEETING_BLOCK = 'bg-drNavy/70 text-white';

const hm = (t, fallback) => (t ? String(t).slice(0, 5) : fallback);

// טווח הזמן של משימה: התחלה מ-starts_on+שעה (או scheduled/created), סיום מ-due_at.
export function taskSpan(task) {
  const start = task.starts_on
    ? new Date(`${task.starts_on}T${hm(task.start_time, '08:00')}`)
    : task.scheduled_start_at
      ? new Date(task.scheduled_start_at)
      : new Date(task.created_at);

  let end = task.due_at
    ? new Date(task.due_at)
    : task.ends_on
      ? new Date(`${task.ends_on}T${hm(task.due_time, '23:59')}`)
      : new Date(start.getTime() + 3600000);

  if (end <= start) end = new Date(start.getTime() + 1800000);
  return { start, end };
}

export function isOverrun(task, now = new Date()) {
  return lateness(task, now) !== null;
}

// tooltip: שם · לקוח · יעד
export function taskTooltip(task) {
  const parts = [`#${task.id} ${task.title}`];
  if (task.client?.name) parts.push(task.client.name);
  const dl = deadlineOf(task);
  if (dl) parts.push(new Date(dl).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }));
  return parts.join(' · ');
}

// אחוז מיקום נקודת-זמן בטווח [0..100], נחתך לגבולות.
export function pct(date, rangeStart, rangeEnd) {
  const span = rangeEnd - rangeStart;
  if (span <= 0) return 0;
  const p = ((new Date(date) - rangeStart) / span) * 100;
  return Math.max(0, Math.min(100, p));
}
