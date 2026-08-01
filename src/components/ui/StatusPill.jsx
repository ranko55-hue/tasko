import { he } from '../../locales/he';
const TONES = {
  gray: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-700',
  done: 'bg-slate-200 text-slate-500',
  purple: 'bg-purple-100 text-purple-700',
};

// מיפוי סטטוס משימה → tone (מקודד את סעיף 4)
export const STATUS_TONE = {
  pending: 'gray',
  scheduled: 'blue',
  in_progress: 'green',
  paused: 'yellow',
  blocked: 'red',
  done: 'done',
  pending_approval: 'purple',
  cancelled: 'done',
};

export default function StatusPill({ tone, label, status, pulse = false }) {
  const resolvedTone = tone ?? STATUS_TONE[status] ?? 'gray';
  const resolvedLabel = label ?? (status ? (he.tasks.status[status] ?? status) : undefined);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${TONES[resolvedTone] ?? TONES.gray}`}
    >
      {pulse && <span className="h-2 w-2 animate-pulse rounded-full bg-current" />}
      {resolvedLabel}
    </span>
  );
}
