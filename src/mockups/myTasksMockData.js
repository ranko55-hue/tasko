// נתוני דמה למוקאפ "המשימות שלי" בדסקטופ. סטטי לחלוטין — אפס שאילתות.
// ההרכב נדרש בתדריך: אחת בעבודה עם טיימר רץ, אחת ממתינה, אחת מעוכבת,
// ושתיים שהושלמו.

export const MOCK_MY_TASKS = [
  {
    id: 1042,
    title: 'החלפת גופי תאורה בחזית הראשית',
    client: 'עיריית חדרה',
    project: 'שיפוץ בית ספר הגבעה',
    address: 'רחוב הזורע 8, חדרה',
    status: 'in_progress',
    due: '14:30',
    dueDate: '31.07',
    estMinutes: 180,
    netSeconds: 4230, // 1:10:30 — טיימר רץ
    priority: 'urgent',
  },
  {
    id: 1043,
    title: 'בדיקת לוח חשמל ראשי',
    client: 'עיריית חדרה',
    project: 'שיפוץ בית ספר הגבעה',
    address: 'רחוב הזורע 8, חדרה',
    status: 'pending',
    due: '16:00',
    dueDate: '31.07',
    estMinutes: 60,
    netSeconds: 0,
    priority: 'normal',
  },
  {
    id: 1039,
    title: 'התקנת מזגן במשרד הנהלה',
    client: 'קיפי בניה',
    project: 'בניין XXX',
    address: 'הרצל 42, נתניה',
    status: 'blocked',
    due: '12:00',
    dueDate: '31.07',
    estMinutes: 120,
    netSeconds: 2640,
    priority: 'normal',
    blockReason: 'אין גישה לחדר — המפתח אצל מנהל האתר ולא הגיע',
  },
  {
    id: 1031,
    title: 'תיקון נזילה במקלחות',
    client: 'עיריית חדרה',
    project: 'שיפוץ בית ספר הגבעה',
    status: 'done',
    due: '09:00',
    dueDate: '31.07',
    estMinutes: 45,
    netSeconds: 2280, // 0:38
    priority: 'normal',
  },
  {
    id: 1028,
    title: 'החלפת מנעול בשער האחורי',
    client: 'קיפי בניה',
    project: 'בניין XXX',
    status: 'done',
    due: '08:15',
    dueDate: '31.07',
    estMinutes: 30,
    netSeconds: 1500, // 0:25
    priority: 'normal',
  },
];

export const OPEN_TASKS = MOCK_MY_TASKS.filter((t) => t.status !== 'done');
export const DONE_TASKS = MOCK_MY_TASKS.filter((t) => t.status === 'done');

// שניות → H:MM:SS או M:SS, כמו formatDuration במוצר
export function fmtDuration(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

// דקות מוקצבות → "2:00"
export function fmtEst(min) {
  const h = Math.floor((min || 0) / 60);
  const m = (min || 0) % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}
