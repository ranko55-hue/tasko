import { supabase } from './supabase';

const BUCKET = 'project-files';
const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// שומר על סיומת הקובץ בלבד; שם הקובץ המקורי נשמר בטבלה ולא בנתיב,
// כדי שעברית ורווחים לא ישברו את ה-key ב-Storage.
function extOf(name) {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name || '');
  return m ? m[1].toLowerCase() : 'bin';
}

export function isImage(mime) {
  return typeof mime === 'string' && mime.startsWith('image/');
}

// העלאה עם חיווי התקדמות (XHR — supabase-js לא חושף progress),
// באותה תבנית כמו uploadTaskMedia. מבנה נתיב: {org_id}/{project_id}/{uuid}.{ext}
export async function uploadProjectFile(project, file, onProgress) {
  const path = `${project.org_id}/${project.id}/${crypto.randomUUID()}.${extOf(file.name)}`;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL_BASE}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('apikey', KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('upload_failed'));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });

  return path;
}

// כתובת חתומה — ה-bucket פרטי, אין כתובת ציבורית.
export async function signedFileUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeStoredFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
