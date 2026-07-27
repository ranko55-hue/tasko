// צבעי סטטוס ועדיפות — הסטטוס הוא שפת המערכת (עקרונות עיצוב סעיף 2)
export const STATUS_STYLES = {
  scheduled: 'bg-violet-100 text-violet-800',
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  paused: 'bg-amber-100 text-amber-800',
  blocked: 'bg-red-100 text-red-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-500',
};

export const PRIORITY_STYLES = {
  normal: 'bg-slate-100 text-slate-600',
  urgent: 'bg-red-100 text-red-700',
};
