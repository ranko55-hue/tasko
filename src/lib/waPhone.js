// עזרי וואטסאפ — מקור אמת יחיד לכל קישורי wa.me במערכת (פורט מפריליו).

// נרמול מספר טלפון לפורמט בינלאומי (05x → 9725x). מחזיר ספרות בלבד.
export function waPhone(p) {
  let d = String(p || '').replace(/[^0-9+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return d;
}

// קישור wa.me מוכן — עם הודעה מוקדמת אופציונלית. ריק אם אין טלפון תקין.
export function buildWaLink(phone, text) {
  const p = waPhone(phone);
  if (!p) return '';
  return text ? `https://wa.me/${p}?text=${encodeURIComponent(text)}` : `https://wa.me/${p}`;
}

// טוקנים של תבניות וואטסאפ — סוגריים בודדים בעברית, כמו שהמשתמש רואה.
export const WA_TOKENS = [
  { token: '{שם העובד}', key: 'employeeName' },
  { token: '{שם הלקוח}', key: 'clientName' },
  { token: '{שם הארגון}', key: 'orgName' },
  { token: '{מספר משימה}', key: 'taskNumber' },
  { token: '{שם משימה}', key: 'taskName' },
  { token: '{קישור}', key: 'link' },
];

// החלפת טוקנים בערכים. טוקן ללא ערך בהקשר → מוחלף במחרוזת ריקה.
export function fillTokens(body, ctx = {}) {
  let out = body || '';
  for (const { token, key } of WA_TOKENS) {
    out = out.split(token).join(ctx[key] ?? '');
  }
  return out;
}

// מזהה ההתחברות של עובד: אימייל אמיתי אם קיים, אחרת אימייל סינתטי מבוסס-טלפון.
// מבוסס-טלפון (ולא על מזהה החבר) כדי שהעובד יוכל להתחבר שוב עם הטלפון + סיסמה.
export const INVITE_EMAIL_DOMAIN = 'invite.tasko.app';
export function loginEmailFor({ email, phone } = {}) {
  const e = (email || '').trim().toLowerCase();
  if (e) return e;
  const p = waPhone(phone);
  return p ? `wa-${p}@${INVITE_EMAIL_DOMAIN}` : '';
}
