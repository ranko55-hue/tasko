import { mkMy } from './myTasksStrings';

const NUM = { fontVariantNumeric: 'tabular-nums' };

// נקודת סטטוס — הצבעים מסעיף 4 ב-DESIGN.md. פועמת רק כשהסטטוס באמת חי.
const DOT = {
  in_progress: 'bg-statusGreen',
  pending: 'bg-slate-400',
  blocked: 'bg-statusRed',
  done: 'bg-slate-300',
};

export function StatusDot({ status }) {
  const live = status === 'in_progress';
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${DOT[status] ?? 'bg-slate-400'} ${
        live ? 'animate-softPulse' : ''
      }`}
    />
  );
}

const TEXT = {
  in_progress: 'text-statusGreen',
  pending: 'text-slate-500',
  blocked: 'text-statusRed',
  done: 'text-slate-400',
};

// שם הסטטוס בצבע הסטטוס — כמו כרטיס הלוח (DESIGN §10ד)
export function StatusName({ status }) {
  return (
    <span className={`text-[12.5px] font-bold ${TEXT[status] ?? 'text-slate-500'}`}>
      {mkMy.status[status]}
    </span>
  );
}

// מספר המשימה בקצה השורה/הכרטיס, ספרות tabular
export function TaskNumber({ id }) {
  return (
    <span dir="ltr" className="shrink-0 text-xs text-slate-400" style={NUM}>
      #{id}
    </span>
  );
}

// אזור תחום במסגרת עם כותרת — שפת מגדל הפיקוח
export function Panel({ title, count, children, muted = false }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <header
        className={`flex items-center gap-2 border-b border-line px-4 py-3 ${
          muted ? 'bg-slate-50' : 'bg-surfaceBar'
        }`}
      >
        <h2 className={`text-sm font-black ${muted ? 'text-slate-500' : 'text-slate-900'}`}>
          {title}
        </h2>
        <span
          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600"
          style={NUM}
        >
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}

// כפתור פעולה קטן — כחול לפעולה בתוך כרטיס/שורה (DESIGN §3),
// לעולם לא צהוב: הצהוב שמור לפעולה הראשית של המסך.
export function ActionButton({ label, tone = 'brand', size = 'sm' }) {
  const tones = {
    brand: 'bg-brand text-white hover:bg-brand/90',
    outline: 'border border-line bg-white text-slate-700 hover:bg-slate-50',
    danger: 'border border-red-300 bg-white text-red-600 hover:bg-red-50',
  };
  const sizes = {
    sm: 'min-h-[44px] px-3 text-sm',
    lg: 'min-h-[48px] w-full px-4 text-base',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-bold ${tones[tone]} ${sizes[size]}`}
    >
      {label}
    </span>
  );
}

export { NUM };
