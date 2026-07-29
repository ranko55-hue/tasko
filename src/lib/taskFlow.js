import { supabase } from './supabase';

// עמודות שחוזרות אחרי כל מעבר סטטוס — עקביות מול useMyTasks
const COLS =
  'id, org_id, title, description, address, status, priority, due_at, ' +
  'scheduled_start_at, est_minutes, requirements, required_workers, ' +
  'team_lead_id, assignee_id, net_seconds, work_started_at, overrun_alerted';

// שניות שרצו במקטע העבודה הנוכחי (מאז work_started_at)
function runningSeg(task) {
  if (!task.work_started_at) return 0;
  const ms = Date.now() - new Date(task.work_started_at).getTime();
  return Math.max(0, Math.floor(ms / 1000));
}

// זמן נטו מצטבר כולל המקטע הרץ (אם רץ) — לתצוגת הטיימר
export function elapsedSeconds(task) {
  let s = task.net_seconds || 0;
  if (task.status === 'in_progress' && task.work_started_at) s += runningSeg(task);
  return s;
}

// משימה עתידית שנעולה לביצוע — scheduled_start_at בעתיד
export function isLocked(task) {
  return (
    task.scheduled_start_at &&
    new Date(task.scheduled_start_at).getTime() > Date.now()
  );
}

async function patch(taskId, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update(fields)
    .eq('id', taskId)
    .select(COLS)
    .single();
  if (error) throw error;
  return data;
}

async function logEvent(task, actorId, type, payload = {}) {
  await supabase.from('task_events').insert({
    org_id: task.org_id,
    task_id: task.id,
    actor_id: actorId,
    type,
    payload,
  });
}

// התחלת ביצוע — הטיימר מתחיל לרוץ
export async function startTask(task, actorId) {
  const updated = await patch(task.id, {
    status: 'in_progress',
    work_started_at: new Date().toISOString(),
  });
  await logEvent(task, actorId, 'started');
  return updated;
}

// הפסקה — הזמן נעצר ונצבר
export async function pauseTask(task, actorId) {
  const net = (task.net_seconds || 0) + runningSeg(task);
  const updated = await patch(task.id, {
    status: 'paused',
    net_seconds: net,
    work_started_at: null,
  });
  await logEvent(task, actorId, 'paused', { seconds: net });
  return updated;
}

// המשך אחרי הפסקה
export async function resumeTask(task, actorId) {
  const updated = await patch(task.id, {
    status: 'in_progress',
    work_started_at: new Date().toISOString(),
  });
  await logEvent(task, actorId, 'resumed');
  return updated;
}

// סיום — צובר את המקטע האחרון וסוגר
export async function finishTask(task, actorId) {
  const net = (task.net_seconds || 0) + runningSeg(task);
  const updated = await patch(task.id, {
    status: 'done',
    net_seconds: net,
    work_started_at: null,
  });
  await logEvent(task, actorId, 'finished', { seconds: net });
  return updated;
}

// דיווח עיכוב — עוצר את הזמן ומסמן חסום
export async function blockTask(task, actorId, reason) {
  const net = (task.net_seconds || 0) + runningSeg(task);
  const updated = await patch(task.id, {
    status: 'blocked',
    net_seconds: net,
    work_started_at: null,
  });
  await logEvent(task, actorId, 'blocked', { text: reason });
  return updated;
}

// החזרה לעבודה מחסימה (עובד או מנהל)
export async function unblockTask(task, actorId) {
  const updated = await patch(task.id, {
    status: 'in_progress',
    work_started_at: new Date().toISOString(),
  });
  await logEvent(task, actorId, 'unblocked');
  return updated;
}

// הערה מוקלדת — אירוע בלבד, בלי שינוי סטטוס
export async function addNote(task, actorId, text) {
  await logEvent(task, actorId, 'text_note', { text });
}

// חריגה ממסגרת זמן — נרשם פעם אחת בלבד (overrun_alerted)
export async function markOverrun(task, actorId) {
  await logEvent(task, actorId, 'overrun', {
    est_minutes: task.est_minutes,
    net_seconds: elapsedSeconds(task),
  });
  return patch(task.id, { overrun_alerted: true });
}

// עדכון מהמנהל לעובד — מופיע בציר הזמן של שני הצדדים
export async function addManagerUpdate(task, actorId, text, path = null) {
  await logEvent(task, actorId, 'manager_attachment', path ? { text, path } : { text });
}

// תמונה / הקלטה קולית — נשמרות ב-Storage, כאן נרשם האירוע עם הנתיב
export async function addPhotoEvent(task, actorId, path) {
  await logEvent(task, actorId, 'photo', { path });
}

export async function addVoiceNote(task, actorId, path) {
  await logEvent(task, actorId, 'voice_note', { path });
}
