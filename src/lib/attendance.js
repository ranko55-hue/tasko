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
