// חישובי זמן למשימה — ניצול מול מוקצב, וחריגה.
//
// באג שתוקן: החריגה חושבה כ-(net - est) והוצגה כמו שהיא. השדה overrun_alerted
// נשאר דלוק גם אחרי שהמוקצב מוגדל בעריכה, ואז ההפרש שלילי — והמסך הציג
// "‎180- דקות מעל". כאן ההפרש נגזם לאפס ומצב החריגה נקבע לפי הזמן בפועל.

const ACTIVE = ['in_progress', 'paused', 'pending_approval'];

export function usedMinutes(task) {
  return Math.max(0, Math.floor((task?.net_seconds ?? 0) / 60));
}

export function allocatedMinutes(task) {
  return task?.est_minutes ?? null;
}

// דקות מעל המוקצב — לעולם לא שלילי
export function overrunMinutes(task) {
  const est = allocatedMinutes(task);
  if (!est) return 0;
  return Math.max(0, usedMinutes(task) - est);
}

// חריגה אמיתית: יש מוקצב, והזמן בפועל עבר אותו
export function isOverTime(task) {
  return overrunMinutes(task) > 0;
}

// אחוז ניצול (יכול לעבור 100)
export function usagePercent(task) {
  const est = allocatedMinutes(task);
  if (!est) return 0;
  return Math.round((usedMinutes(task) / est) * 100);
}

// "3 שעות" / "45 דקות" / "2 שעות ו-15 דקות"
export function humanMinutes(mins, he) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} ${he.time.minutes}`;
  if (rest === 0) return `${h} ${h === 1 ? he.time.hour : he.time.hours}`;
  return `${h} ${h === 1 ? he.time.hour : he.time.hours} ${he.time.and}${rest} ${he.time.minutes}`;
}

// האם הטיימר רץ כרגע
export function isRunning(task) {
  return task?.status === 'in_progress' && !!task?.work_started_at;
}

export function isActiveStatus(status) {
  return ACTIVE.includes(status);
}
