import { he } from '../../../locales/he';
import { formatDuration } from '../../../lib/time';
import { isRunning } from '../../../lib/taskTime';

const t = he.tasks;
const d = t.drawer;
const NUM = { fontVariantNumeric: 'tabular-nums' };

// כרטיסון העובד המבצע. הפעימה והטיימר מופיעים רק כשהמשימה באמת בעבודה.
export default function AssigneeCard({ task, assigneeName }) {
  const running = isRunning(task);
  const name = assigneeName || t.unassigned;

  return (
    <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl border border-line bg-white p-3 sm:mx-6">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-black text-brandYellow">
        {name.trim()[0]?.toUpperCase() ?? '·'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-navy">{name}</div>
        <div className="mt-1 flex items-center gap-2 text-xs text-grayMid">
          {running && <span className="h-2 w-2 rounded-full bg-statusGreen animate-softPulse" />}
          {running ? d.workingNow : d.notWorking}
        </div>
      </div>

      {running && (
        <span
          className="shrink-0 rounded-lg border border-statusGreen/40 bg-statusGreen/10 px-3 py-1 text-sm font-bold text-green-700"
          style={NUM}
        >
          {formatDuration(task.net_seconds)}
        </span>
      )}
    </div>
  );
}
