// נתוני דמה למוקאפים בלבד. אינם נוגעים ב-Supabase ואינם משמשים מסך חי.
// "עכשיו" מקובע כדי שהמוקאפ ייראה זהה בכל טעינה ולא ישתנה עם הזמן.

export const NOW = new Date('2026-07-29T11:00:00+03:00');

const CLIENTS = [
  'עיריית חדרה',
  'עיריית נתניה',
  'מועצה אזורית עמק חפר',
  'עיריית פרדס חנה-כרכור',
  'מועצה מקומית בנימינה',
  'עיריית חיפה',
  'מועצה אזורית מנשה',
  'עיריית אור עקיבא',
];

const PROJECTS = [
  'שיפוץ בית ספר הגבעה',
  'תאורת רחוב — שלב ב׳',
  'מרכז קהילתי חדש',
  'גנים ציבוריים 2026',
  'תחזוקת מוסדות חינוך',
  null, // משימה תחת הלקוח בלבד
];

const TITLES = [
  'החלפת גופי תאורה בחזית הראשית',
  'תיקון דליפה בצנרת ראשית',
  'בדיקת מערכת גילוי אש',
  'החלפת לוח חשמל בכיתה 12',
  'תחזוקת מעלית — ביקורת שנתית',
  'איטום גג רטוב',
  'החלפת ברזי כיבוי',
  'תיקון גדר היקפית',
  'שדרוג מזגנים באגף המנהלה',
  'צביעת מעקות בטיחות',
  'החלפת מתקן משחקים שבור',
  'תיקון תאורת חירום במסדרון',
  'ניקוי מערכת ניקוז',
  'התקנת שילוט הכוונה',
  'בדיקת תקינות ארון תקשורת',
  'החלפת דלת אש פגומה',
  'טיפול ברטיבות בקיר מזרחי',
  'החלפת משאבת ביוב',
  'תיקון ריצוף במסדרון ראשי',
  'התקנת מצלמות בכניסה',
];

const WORKERS = [
  'אבי כהן',
  'יוסי לוי',
  'משה דהן',
  'ניר אברהם',
  'דוד מזרחי',
  'עומר בן דוד',
  null, // לא הוקצתה
];

const STATUSES = ['pending', 'scheduled', 'in_progress', 'paused', 'blocked', 'done'];

function iso(daysFromNow, hour = 9) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// 50 משימות דטרמיניסטיות — בלי אקראיות, כדי שהמוקאפ יהיה יציב.
function build() {
  const out = [];
  for (let i = 0; i < 50; i++) {
    const status = STATUSES[i % STATUSES.length];
    // כל משימה שביעית ללא עובד, כדי שיהיו מספיק מקרי "לא הוקצתה"
    const worker = i % 7 === 6 ? null : WORKERS[i % 6];
    // פיזור יעדים: חלק בעבר (איחור), רוב בעתיד
    const dueOffset = [-6, -3, -1, 0, 1, 2, 4, 7, 11][i % 9];
    // כל משימה חמישית נמשכת כמה ימים
    const multiDay = i % 5 === 2;
    const startOffset = multiDay ? dueOffset - (3 + (i % 4)) : null;

    out.push({
      id: 1000 + i,
      title: TITLES[i % TITLES.length],
      client: CLIENTS[i % CLIENTS.length],
      project: PROJECTS[i % PROJECTS.length],
      assignee: worker,
      status,
      priority: i % 11 === 0 ? 'urgent' : 'normal',
      due_at: iso(dueOffset, 8 + (i % 8)),
      starts_at: startOffset === null ? null : iso(startOffset, 8),
      est_minutes: [60, 120, 180, 240, 480][i % 5],
      net_seconds: [900, 3600, 7200, 15000, 26000][i % 5],
    });
  }
  return out;
}

export const MOCK_TASKS = build();

export const CLOSED = ['done', 'cancelled'];

// ── איחור ─────────────────────────────────────────────────────────────────
// משימה באיחור = עבר לה היעד והיא עדיין פתוחה. משימה רב-יומית אינה באיחור
// רק משום שהיא נמשכת כמה ימים — נבחן היעד בלבד.
export function lateness(task) {
  if (CLOSED.includes(task.status)) return null;
  if (!task.due_at || new Date(task.due_at) >= NOW) return null;
  return task.assignee ? 'working' : 'unassigned';
}

// "לא הוקצתה" חמור יותר מ"בעבודה"
const LATE_RANK = { unassigned: 0, working: 1 };

export function sortByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    const la = lateness(a);
    const lb = lateness(b);
    if (la && lb) {
      const r = LATE_RANK[la] - LATE_RANK[lb];
      if (r !== 0) return r;
      return new Date(a.due_at) - new Date(b.due_at); // הוותיק קודם
    }
    if (la) return -1;
    if (lb) return 1;
    return new Date(a.due_at ?? 0) - new Date(b.due_at ?? 0);
  });
}

export function isMultiDay(task) {
  if (!task.starts_at || !task.due_at) return false;
  return new Date(task.starts_at).toDateString() !== new Date(task.due_at).toDateString();
}

const dm = (isoStr) => {
  const d = new Date(isoStr);
  return `${d.getDate()}.${d.getMonth() + 1}`;
};

// טווח לרב-יומית, אחרת תאריך יעד בלבד
export function dateLabel(task) {
  if (!task.due_at) return null;
  return isMultiDay(task) ? `${dm(task.starts_at)} – ${dm(task.due_at)}` : dm(task.due_at);
}
