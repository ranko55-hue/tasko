import { he } from '../../../locales/he';
import { STATUS_TONE } from '../../ui/StatusPill';

export const NUM = { fontVariantNumeric: 'tabular-nums' };

// נקודת סטטוס — צבעים מסעיף 4 ב-DESIGN.md, דרך אותו מיפוי STATUS_TONE
// שמשמש את StatusPill, כדי שלא ייווצר מיפוי סטטוס שני במערכת.
const DOT = {
  gray: 'bg-slate-400',
  blue: 'bg-statusBlue',
  green: 'bg-statusGreen',
  yellow: 'bg-yellow-500',
  red: 'bg-statusRed',
  done: 'bg-slate-300',
};

const TEXT = {
  gray: 'text-slate-500',
  blue: 'text-statusBlue',
  green: 'text-statusGreen',
  yellow: 'text-yellow-700',
  red: 'text-statusRed',
  done: 'text-slate-400',
};

export function StatusDot({ status, live = false }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]} ${live ? 'animate-softPulse' : ''}`}
    />
  );
}

// שם הסטטוס בצבע הסטטוס — כמו כרטיס הלוח (DESIGN §10ד)
export function StatusName({ status }) {
  const tone = STATUS_TONE[status] ?? 'gray';
  return (
    <span className={`text-[12.5px] font-bold ${TEXT[tone]}`}>
      {he.tasks.status[status] ?? status}
    </span>
  );
}

export function TaskNumber({ id }) {
  return (
    <span dir="ltr" className="shrink-0 text-xs text-slate-400" style={NUM}>
      #{id}
    </span>
  );
}

// אזור תחום במסגרת עם כותרת ומונה — שפת מגדל הפיקוח
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
