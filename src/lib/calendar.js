// עזרי יומן — הרחבת מחזוריות בזמן ריצה + עזרי תאריך לגריד.
// שכבת האירועים נשמרת גנרית: expandMeetings מחזירה אירועים מנורמלים, כדי
// שבבלוק הגאנט אפשר יהיה למזג גם משימות לאותו מבנה.

export const RECURRENCE = ['none', 'daily', 'weekly', 'biweekly', 'monthly'];

const DAY = 24 * 60 * 60 * 1000;

// YYYY-MM-DD לפי אזור הזמן המקומי (לא UTC) — משמש כמפתח יום ולהשוואת חריגים.
export function ymd(date) {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// שבוע מתחיל ביום ראשון (ישראל).
export function startOfWeek(date) {
  const d = startOfDay(date);
  return addDays(d, -d.getDay());
}

// 7 ימי השבוע שמכיל את date.
export function weekDays(date) {
  const s = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}

// מטריצת ימי החודש לתצוגת חודש — שבועות שלמים (ראשון–שבת) שמכסים את החודש.
export function monthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const weeks = [];
  let cur = gridStart;
  // עד 6 שבועות; עוצרים אחרי שכיסינו את החודש
  for (let w = 0; w < 6; w++) {
    const days = Array.from({ length: 7 }, (_, i) => addDays(cur, i));
    weeks.push(days);
    cur = addDays(cur, 7);
    if (cur.getMonth() !== date.getMonth() && cur > new Date(date.getFullYear(), date.getMonth() + 1, 0)) {
      break;
    }
  }
  return weeks;
}

function addStep(date, rec) {
  const d = new Date(date);
  if (rec === 'daily') d.setDate(d.getDate() + 1);
  else if (rec === 'weekly') d.setDate(d.getDate() + 7);
  else if (rec === 'biweekly') d.setDate(d.getDate() + 14);
  else if (rec === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

function occurrence(m, start, durMs) {
  const s = new Date(start);
  return {
    key: `${m.id}:${ymd(s)}`,
    meeting: m,
    start: s,
    end: new Date(s.getTime() + durMs),
    date: ymd(s),
  };
}

// הרחבת רשימת פגישות (מאסטר + עצמאיות) לאירועים בטווח [rangeStart, rangeEnd].
export function expandMeetings(meetings, rangeStart, rangeEnd) {
  const out = [];
  for (const m of meetings) {
    const start = new Date(m.starts_at);
    const durMs = Math.max(0, new Date(m.ends_at) - start);

    if (m.recurrence === 'none') {
      if (start >= rangeStart && start <= rangeEnd) out.push(occurrence(m, start, durMs));
      continue;
    }

    const until = m.recurrence_until ? endOfDay(new Date(m.recurrence_until)) : rangeEnd;
    const excluded = m.excluded_dates || [];
    let cur = new Date(start);
    let guard = 0;
    while (cur <= rangeEnd && cur <= until && guard < 1000) {
      if (cur >= rangeStart && !excluded.includes(ymd(cur))) {
        out.push(occurrence(m, cur, durMs));
      }
      cur = addStep(cur, m.recurrence);
      guard += 1;
    }
  }
  return out.sort((a, b) => a.start - b.start);
}

// קיבוץ אירועים לפי יום (מפתח ymd) — לשימוש בגריד.
export function groupByDate(events) {
  const map = {};
  for (const e of events) {
    (map[e.date] ||= []).push(e);
  }
  return map;
}

export function hhmm(date) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const MS_DAY = DAY;
