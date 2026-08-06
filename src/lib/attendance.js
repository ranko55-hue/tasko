import { supabase } from './supabase';

const BUCKET = 'attendance-notes';
const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const ATT_TYPES = ['work', 'vacation', 'sick'];

const pad = (n) => String(n).padStart(2, '0');
export function ymd(d = new Date()) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}
// יום עבודה בישראל: ראשון–חמישי.
export function isWorkday(dateStr) {
  const g = new Date(`${dateStr}T00:00:00`).getDay();
  return g >= 0 && g <= 4;
}
export function lastDays(n) {
  const out = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(ymd(d));
  }
  return out;
}
export function monthRange(d = new Date()) {
  const s = new Date(d.getFullYear(), d.getMonth(), 1);
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: ymd(s), to: ymd(e) };
}
export function eachDate(from, to) {
  const out = [];
  let c = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (c <= end) { out.push(ymd(c)); c.setDate(c.getDate() + 1); }
  return out;
}

function extOf(name) {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name || '');
  return m ? m[1].toLowerCase() : 'bin';
}

// העלאת אישור מחלה ל-bucket הפרטי (העובד רשאי על עצמו — מיגרציה 029).
export async function uploadSickNote(orgId, memberId, file) {
  const path = `${orgId}/${memberId}/${crypto.randomUUID()}.${extOf(file.name)}`;
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL_BASE}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('upload_failed')));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
  return path;
}

export async function signedSickNoteUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ── שעות ─────────────────────────────────────────────────────────────────
const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};
const round2 = (n) => Math.round(n * 100) / 100;

// שעות יום מלא לפי הגדרת שעות העבודה של הארגון.
export function fullDayHours(settings) {
  return round2(Math.max(0, (toMin(settings?.work_end_time) - toMin(settings?.work_start_time)) / 60));
}
export function hoursBetween(start, end) {
  return round2(Math.max(0, (toMin(end) - toMin(start)) / 60));
}
export function workdaysInRange(from, to) {
  return eachDate(from, to).filter(isWorkday);
}

// "4.5" / "9" — בלי אפסים מיותרים.
export function fmtHours(h) {
  return Number(h ?? 0).toFixed(2).replace(/\.?0+$/, '');
}

// בניית רשומות לפי היקף: 'full' יום מלא · 'hours' טווח שעות · 'range' טווח תאריכים.
export function buildEntries({ orgId, memberId, reportedBy, type, scope, date, start, end, from, to, note, attachmentPath, settings }) {
  const base = {
    org_id: orgId, member_id: memberId, type,
    note: note || null, attachment_path: attachmentPath || null,
    reported_by: reportedBy || null, updated_at: new Date().toISOString(),
  };
  if (scope === 'hours') {
    return [{ ...base, date, start_time: start, end_time: end, hours: hoursBetween(start, end) }];
  }
  if (scope === 'range') {
    const full = fullDayHours(settings);
    return workdaysInRange(from, to).map((d) => ({ ...base, date: d, start_time: null, end_time: null, hours: full }));
  }
  return [{ ...base, date, start_time: null, end_time: null, hours: fullDayHours(settings) }];
}

export async function saveAttendance(rows) {
  if (!rows.length) return;
  const { error } = await supabase
    .from('attendance_entries')
    .upsert(rows, { onConflict: 'org_id,member_id,date' });
  if (error) throw error;
}

// סיכום חודשי: סך שעות עבודה, ימי חופשה, ימי מחלה.
export function monthlySummary(entries) {
  let workHours = 0, vacationDays = 0, sickDays = 0;
  for (const e of entries) {
    if (e.type === 'work') workHours += Number(e.hours || 0);
    else if (e.type === 'vacation') vacationDays += 1;
    else if (e.type === 'sick') sickDays += 1;
  }
  return { workHours: round2(workHours), vacationDays, sickDays };
}
