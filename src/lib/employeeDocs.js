import { supabase } from './supabase';

const BUCKET = 'employee-docs';
const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function extOf(name) {
  const m = /\.([a-zA-Z0-9]{1,8})$/.exec(name || '');
  return m ? m[1].toLowerCase() : 'bin';
}

export async function uploadEmployeeDoc(orgId, memberId, file, onProgress) {
  const path = `${orgId}/${memberId}/${crypto.randomUUID()}.${extOf(file.name)}`;
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

  return { path, mime: file.type };
}

export async function signedDocUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
