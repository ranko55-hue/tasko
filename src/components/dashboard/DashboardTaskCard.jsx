import { he } from '../../locales/he';
import { STATUS_DOT } from '../../lib/taskMeta';
import { isOverrun } from '../../lib/dashboardModel';
import { overrunMinutes } from '../../lib/taskTime';
import { dateRangeLabel, isMultiDay } from '../../lib/taskDates';
import { formatDuration } from '../../lib/time';
import Icon from '../ui/Icon';

// צבעי סטטוס לטקסט
const STATUS_TEXT_COLOR = {
  pending: 'text-slate-500',
  scheduled: 'text-statusBlue',
  in_progress: 'text-statusGreen',
  paused: 'text-brandYellow',
  blocked: 'text-statusRed',
  done: 'text-slate-500',
  cancelled: 'text-slate-500',
};

// כרטיס משימה ב-Dashboard חדש — עיצוב 2026
export default function DashboardTaskCard({
  task,
  assigneeName,
  blockedReason,
  onOpenTask,
  onReturnToWork,
}) {

  const overrun = isOverrun(task);
  const progress = task.est_minutes ? (task.net_seconds / 60) / task.est_minutes : 0;
  const progressPct = Math.round(progress * 100);
  const statusTextColor = STATUS_TEXT_COLOR[task.status] || 'text-slate-500';

  // בחר צבע פס: ירוק ≤85%, כתום 85-100%, אדום >100%, אפור = paused
  let barColor = 'bg-statusGreen';
  let statusText = `תקין · ${progressPct}%`;
  if (task.status === 'paused') {
    barColor = 'bg-slate-400';
    statusText = `הזמן עצור · הפסקה`;
  } else if (overrun) {
    barColor = 'bg-statusRed';
    statusText = `חריגה · ${overrunMinutes(task)} ${he.time.minutes} מעל`;
  } else if (progressPct >= 85) {
    barColor = 'bg-yellow-500';
    statusText = `מתקרב ליעד · ${progressPct}%`;
  }


  const timeDisplay = task.est_minutes
    ? `${Math.floor(task.net_seconds / 60)}:${String(task.net_seconds % 60).padStart(2, '0')} / ${task.est_minutes}:00`
    : null;

  return (
    <div
      onClick={() => onOpenTask?.(task.id)}
      className="cursor-pointer overflow-hidden rounded-[10px] border border-line bg-white shadow-sm transition-colors hover:border-slate-300"
    >
      {/* Top row: status dot + name + number */}
      <div className="flex items-baseline gap-2 border-b border-line px-3 py-2">
        <span
          className={`shrink-0 h-1.5 w-1.5 rounded-full ${STATUS_DOT[task.status] || 'bg-slate-400'}`}
        />
        <span className={`font-bold text-[12.5px] ${statusTextColor}`}>
          {he.tasks.status[task.status] || task.status}
        </span>
        <span className="ml-auto text-xs text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
          #{task.id}
        </span>
      </div>

      {/* Title */}
      <div className="px-3 py-2 font-bold text-slate-900">{task.title}</div>

      {/* Client · Project */}
      <div className="px-3 text-sm text-slate-500">
        {/* v8 §3.4: הלקוח הוא העוגן ותמיד מוצג; הפרויקט נוסף רק אם קיים */}
        {task.project?.name
          ? `${task.client?.name ?? he.common.none} · ${task.project.name}`
          : task.client?.name ?? he.common.none}
      </div>

      {/* Data row: due | allocated | priority */}
      <div className="flex gap-4 border-t border-b border-line px-3 py-2 text-xs text-slate-600">
        <div className="min-w-0">
          <div className="text-slate-400">יעד</div>
          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
            {dateRangeLabel(task) ?? he.common.none}
          </div>
        </div>
        <div className="min-w-0 border-l border-line pl-4">
          <div className="text-slate-400">מוקצב</div>
          <div style={{ fontVariantNumeric: 'tabular-nums' }}>
            {task.est_minutes ? `${task.est_minutes}:00` : he.common.none}
          </div>
        </div>
        <div className="min-w-0 border-l border-line pl-4">
          <div className="text-slate-400">דחיפות</div>
          <div>
            {task.priority === 'urgent' ? (
              <span className="inline-flex items-center gap-1 font-bold text-statusRed">
                <Icon name="urgent" size="sm" />
                {he.tasks.priorityOpt.urgent}
              </span>
            ) : (
              he.tasks.priorityOpt.normal
            )}
          </div>
        </div>
      </div>

      {/* Time utilization (if est_minutes) */}
      {task.est_minutes && (
        <div className="px-3 py-2">
          <div className="mb-1 text-sm font-medium text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {timeDisplay}
          </div>
          <div className="h-1 rounded-full bg-slate-200">
            <div
              className={`h-full ${barColor} transition-all`}
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {statusText}
          </div>
        </div>
      )}

      {/* Blocked state */}
      {task.status === 'blocked' && (
        <div className="mx-3 my-2 rounded-lg bg-red-50 px-2 py-2">
          <div className="text-xs font-bold text-red-700">דיווח העובד</div>
          <div className="mt-1 text-xs text-red-900" style={{ paddingRight: '8px', borderRight: '2px solid #fca5a5' }}>
            {blockedReason || he.common.none}
          </div>
        </div>
      )}

      {/* Footer: avatar + name + timer */}
      <div className="border-t border-line px-3 py-2 flex items-center gap-2">
        {assigneeName && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
            {assigneeName[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 text-sm font-bold text-slate-700 truncate">
          {assigneeName || he.tasks.unassigned}
        </div>
        {task.work_started_at && ['in_progress', 'paused'].includes(task.status) && (
          <div className="text-sm text-slate-500" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatDuration(task.net_seconds)}
          </div>
        )}
      </div>

      {/* Action button (only when needed) */}
      {!task.assignee_id && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenTask?.(task.id); }}
          className="w-full bg-brand px-3 py-2 font-bold text-white hover:bg-brand/90 text-sm"
        >
          {he.tasks.assignWorker}
        </button>
      )}
      {task.status === 'blocked' && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onReturnToWork?.(task); }}
          className="w-full bg-brand px-3 py-2 font-bold text-white hover:bg-brand/90 text-sm"
        >
          {he.tasks.handleNow}
        </button>
      )}

    </div>
  );
}
