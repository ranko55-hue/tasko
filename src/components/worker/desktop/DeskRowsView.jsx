import { he } from '../../../locales/he';
import { isLocked } from '../../../lib/taskFlow';
import { formatDuration } from '../../../lib/time';
import { elapsedSeconds } from '../../../lib/taskFlow';
import { StatusDot, StatusName, TaskNumber, Panel, NUM } from './DeskBits';

const w = he.worker;

// פעולת ההקשר של השורה — אחת בלבד לפי מצב, לא סרגל שלם.
// מגירת המשימה נושאת את שאר הפעולות.
function rowAction(task) {
  if (isLocked(task)) return null;
  if (task.status === 'pending' || task.status === 'scheduled')
    return { label: w.start, key: 'start' };
  if (task.status === 'in_progress') return { label: w.finish, key: 'finish' };
  if (task.status === 'paused') return { label: w.resume, key: 'resume' };
  if (task.status === 'blocked') return { label: w.unblock, key: 'unblock' };
  return null;
}

function OpenRow({ task, onOpen, onAction, busy }) {
  const act = rowAction(task);
  const running = task.status === 'in_progress';

  return (
    <div
      className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 ${
        task.status === 'blocked' ? 'bg-red-50/60' : 'hover:bg-slate-50'
      }`}
    >
      <StatusDot status={task.status} live={running} />

      <div className="w-[4.5rem] shrink-0">
        <StatusName status={task.status} />
      </div>

      <button
        type="button"
        onClick={() => onOpen(task.id)}
        className="min-h-touch min-w-0 flex-1 text-start"
      >
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-bold text-slate-900">{task.title}</span>
          {task.priority === 'urgent' && (
            <span className="shrink-0 rounded-full bg-urgentSoft px-2 py-0.5 text-[11px] font-bold text-urgentInk">
              {he.tasks.priorityOpt.urgent}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">
          {[task.client?.name, task.project?.name].filter(Boolean).join(' · ')}
        </div>
      </button>

      <div className="w-28 shrink-0 text-end text-xs" style={NUM}>
        {running ? (
          <span className="font-bold text-statusGreen">{formatDuration(elapsedSeconds(task))}</span>
        ) : (
          <span className="text-slate-400">{formatDuration(elapsedSeconds(task))}</span>
        )}
      </div>

      <TaskNumber id={task.id} />

      <div className="w-32 shrink-0 text-end">
        {act && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction(task, act.key)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand px-3 text-sm font-bold text-white hover:bg-brand/90 disabled:opacity-60"
          >
            {act.label}
          </button>
        )}
      </div>
    </div>
  );
}

// הושלמה — דחוסה, בלי טיימר ובלי כפתורי פעולה.
function DoneRow({ task, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex min-h-touch w-full items-center gap-3 border-b border-line px-4 py-2 text-start last:border-0 hover:bg-slate-50"
    >
      <StatusDot status="done" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-500">{task.title}</span>
      <span className="hidden truncate text-xs text-slate-400 lg:block">
        {task.client?.name}
      </span>
      <TaskNumber id={task.id} />
    </button>
  );
}

export default function DeskRowsView({ open, done, onOpen, onAction, busy }) {
  return (
    <div className="space-y-4">
      <Panel title={w.openPanel} count={open.length}>
        {open.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{w.empty}</p>
        ) : (
          open.map((t) => (
            <OpenRow key={t.id} task={t} onOpen={onOpen} onAction={onAction} busy={busy} />
          ))
        )}
      </Panel>

      {done.length > 0 && (
        <Panel title={w.donePanel} count={done.length} muted>
          {done.map((t) => (
            <DoneRow key={t.id} task={t} onOpen={onOpen} />
          ))}
        </Panel>
      )}

      <p className="px-1 text-xs text-slate-400">{w.drawerHint}</p>
    </div>
  );
}
