import { he } from '../../../locales/he';
import { STATUS_DOT, STATUS_TEXT } from '../../ui/StatusPill';
import Card from '../../ui/Card';

export const NUM = { fontVariantNumeric: 'tabular-nums' };

export function StatusDot({ status, live = false }) {
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-grayLight'} ${live ? 'animate-softPulse' : ''}`}
    />
  );
}

export function StatusName({ status }) {
  return (
    <span className={`text-xs font-bold ${STATUS_TEXT[status] ?? 'text-grayMid'}`}>
      {he.tasks.status[status] ?? status}
    </span>
  );
}

export function TaskNumber({ id }) {
  return (
    <span dir="ltr" className="shrink-0 text-xs text-grayLight" style={NUM}>
      #{id}
    </span>
  );
}

// אזור תחום במסגרת עם כותרת ומונה — שפת מגדל הפיקוח
export function Panel({ title, count, children, muted = false }) {
  return (
    <Card className="overflow-hidden">
      <header
        className={`flex items-center gap-2 border-b border-line px-4 py-3 ${
          muted ? 'bg-surface' : 'bg-surfaceBar'
        }`}
      >
        <h2 className={`text-sm font-black ${muted ? 'text-grayMid' : 'text-navy'}`}>
          {title}
        </h2>
        <span
          className="rounded-full bg-appBg px-2 py-1 text-xs font-bold text-grayDark"
          style={NUM}
        >
          {count}
        </span>
      </header>
      {children}
    </Card>
  );
}
