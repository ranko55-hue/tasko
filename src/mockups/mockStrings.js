// טקסטים למוקאפים בלבד.
// לא ב-he.js בכוונה: אלה מחרוזות זמניות של הדגמה, ואין להן מקום בקובץ
// השפה של המוצר. אם חלופה תיבחר ותיבנה — הטקסטים שלה יעברו ל-he.js.

export const mk = {
  index: {
    title: 'מוקאפים — הבלוק העליון ומבנה הלוח',
    subtitle: 'תצוגה סטטית עם נתוני דמה. אין כאן לוגיקה ואין חיבור לנתונים אמיתיים.',
    partA: 'חלק א — הבלוק העליון האחיד',
    partB: 'חלק ב — מבנה אזור המשימות',
    optColumns: 'חלופה 1 — עמודות',
    optGrouped: 'חלופה 2 — שורות מקובצות',
    optTabs: 'חלופה 3 — לשוניות',
    back: 'חזרה למוקאפים',
    tasksCount: '50 משימות דמה',
  },

  top: {
    nav: ['לוח ניהול', 'לקוחות', 'הגדרות'],
    searchPlaceholder: 'חיפוש משימות, לקוחות, פרויקטים…',
    user: 'רן ספיר',
    logout: 'התנתקות',
    allClear: 'הכל תקין',
    screens: { board: 'לוח ניהול', clients: 'לקוחות', settings: 'הגדרות' },
    screenNote: {
      board: 'התדריך המלא מוצג כאן בלבד, מתחת לפס.',
      clients: 'אותו פס בדיוק — בלי התדריך המלא.',
      settings: 'אותו פס בדיוק — בלי התדריך המלא.',
    },
    fullBriefing: 'תדריך מלא',
    fullBriefingNote: 'הפאנל המורחב של הלוח — קיים רק במסך הלוח.',
  },

  chips: {
    overrun: 'בחריגה',
    late: 'באיחור',
    newCall: 'קריאה חדשה',
  },

  board: {
    areaTitle: 'אזור המשימות',
    columns: {
      waiting: 'ממתין / מתוזמן',
      working: 'בעבודה',
      alert: 'מעוכב / חריגה',
      done: 'הושלם היום',
    },
    groups: {
      late: 'באיחור',
      working: 'בעבודה',
      waiting: 'ממתינות',
      blocked: 'מעוכבות',
      done: 'הושלמו',
    },
    tabs: {
      all: 'הכול',
      electric: 'חשמל ותאורה',
      plumbing: 'אינסטלציה',
      safety: 'בטיחות',
      maintenance: 'תחזוקה כללית',
    },
    lateUnassigned: 'באיחור · לא הוקצתה',
    lateWorking: 'באיחור · בעבודה',
    unassigned: 'לא הוקצתה',
    preview: 'תצוגה מקדימה',
    noProject: 'ללא פרויקט',
    empty: 'אין משימות בקבוצה זו',
    expandHint: 'לחיצה על שורה מרחיבה',
  },

  status: {
    pending: 'ממתינה',
    scheduled: 'מתוזמנת',
    in_progress: 'בטיפול',
    paused: 'מושהית',
    blocked: 'חסומה',
    done: 'הושלמה',
  },
};
