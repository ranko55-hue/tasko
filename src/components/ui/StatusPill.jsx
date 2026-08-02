import { he } from '../../locales/he';
const TONES = {
  gray: 'bg-appBg text-inkSoft',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-dangerLight text-urgentInk',
  done: 'bg-line text-grayMid',
  purple: 'bg-purple-100 text-purple-700',
};

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

export const STATUS_DOT = {
  pending: 'bg-grayLight',
  scheduled: 'bg-statusBlue',
  in_progress: 'bg-statusGreen',
  paused: 'bg-brandYellow',
  blocked: 'bg-statusRed',
  pending_approval: 'bg-purple-500',
  done: 'bg-grayLight',
  cancelled: 'bg-grayLight',
};

export const STATUS_TEXT = {
  pending: 'text-grayMid',
  scheduled: 'text-statusBlue',
  in_progress: 'text-statusGreen',
  paused: 'text-brandYellow',
  blocked: 'text-statusRed',
  pending_approval: 'text-purple-500',
  done: 'text-grayMid',
  cancelled: 'text-grayMid',
};

export const STATUS_INK = {
  pending: 'text-lineDark',
  scheduled: 'text-statusBlue',
  in_progress: 'text-statusGreen',
  paused: 'text-brandYellow',
  blocked: 'text-statusRed',
  pending_approval: 'text-purple-500',
  done: 'text-grayLight',
  cancelled: 'text-grayLight',
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
