// צבעי סטטוס — לפי DESIGN.md סעיף 4, עקביים בכל המערכת (מנהל ועובד).
// ממתין=אפור · מתוזמן=כחול · בביצוע=ירוק · מושהה=צהוב · מעוכב/חריגה=אדום · הושלם=אפור-כהה שקוף
export const STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-700',
  done: 'bg-slate-200 text-slate-500',
  cancelled: 'bg-slate-200 text-slate-500',
};

// נקודת סטטוס מלאה (לאינדיקציה על כרטיסים בלוח)
export const STATUS_DOT = {
  pending: 'bg-slate-400',
  scheduled: 'bg-statusBlue',
  in_progress: 'bg-statusGreen',
  paused: 'bg-brandYellow',
  blocked: 'bg-statusRed',
  done: 'bg-slate-400',
  cancelled: 'bg-slate-400',
};

export const PRIORITY_STYLES = {
  normal: 'bg-slate-100 text-slate-600',
  urgent: 'bg-red-100 text-red-700',
};
