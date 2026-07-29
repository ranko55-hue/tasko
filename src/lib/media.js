import { supabase } from './supabase';

const BUCKET = 'task-media';
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// העלאה עם חיווי התקדמות (XHR — supabase-js לא חושף progress).
// מבנה נתיב: {org_id}/{task_id}/{uuid}.{ext}
export async function uploadTaskMedia(task, ext, blob, contentType, onProgress) {
  const uuid = crypto.randomUUID();
  const path = `${task.org_id}/${task.id}/${uuid}.${ext}`;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    if (contentType) xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(path)
        : reject(new Error('upload_failed'));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(blob);
  });
}

// העשרת אירועים בכתובות חתומות. משותף לציר הזמן ולכרטיס הלוח,
// כדי ששני המקומות יציגו מדיה באותה צורה בדיוק.
export async function withSignedUrls(events) {
  return Promise.all(
    (events ?? []).map(async (ev) => {
      if (!['photo', 'voice_note', 'manager_attachment'].includes(ev.type) || !ev.payload?.path)
        return ev;
      try {
        return { ...ev, url: await signedUrl(ev.payload.path) };
      } catch {
        return { ...ev, url: null };
      }
    })
  );
}

// כתובת חתומה לצפייה (bucket פרטי)
export async function signedUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
