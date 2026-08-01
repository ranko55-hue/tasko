// חישובי זמן למשימה — ניצול מול מוקצב, חריגה, וזמן עבודה נותר.

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

// ── זמן עבודה נותר עד היעד ─────────────────────────────────────────────
// מחשב דקות עבודה בין now ל-deadline לפי חלון שעות העבודה של הארגון.
// כל יום קלנדרי נספר (ללא חישוב שבתות/חגים).
// workStart/workEnd — מחרוזות "HH:MM".
function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

export function workMinutesUntil(deadline, workStart, workEnd, now = new Date()) {
  if (!deadline) return null;
  const dl = new Date(deadline);
  if (dl <= now) return 0;

  const wsMin = timeToMinutes(workStart || '08:00');
  const weMin = timeToMinutes(workEnd || '17:00');
  const dayLen = Math.max(0, weMin - wsMin);
  if (dayLen === 0) return 0;

  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dlDate = new Date(dl.getFullYear(), dl.getMonth(), dl.getDate());

  const nowMinOfDay = now.getHours() * 60 + now.getMinutes();
  const dlMinOfDay = dl.getHours() * 60 + dl.getMinutes();

  // אותו יום
  if (nowDate.getTime() === dlDate.getTime()) {
    const effStart = Math.max(nowMinOfDay, wsMin);
    const effEnd = Math.min(dlMinOfDay, weMin);
    return Math.max(0, effEnd - effStart);
  }

  // יום ראשון — מ-now (או תחילת עבודה) עד סוף יום
  let total = Math.max(0, weMin - Math.max(nowMinOfDay, wsMin));

  // ימים מלאים בין היום ליום היעד
  const msPerDay = 86400000;
  const fullDays = Math.max(0, Math.round((dlDate - nowDate) / msPerDay) - 1);
  total += fullDays * dayLen;

  // יום היעד — מתחילת עבודה עד מועד היעד (או סוף עבודה)
  total += Math.max(0, Math.min(dlMinOfDay, weMin) - wsMin);

  return total;
}
