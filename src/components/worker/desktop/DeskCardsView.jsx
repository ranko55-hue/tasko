import { he } from '../../../locales/he';
import { isLocked, elapsedSeconds } from '../../../lib/taskFlow';
import { formatDuration } from '../../../lib/time';
import { allocatedMinutes, usagePercent } from '../../../lib/taskTime';
import { StatusDot, StatusName, TaskNumber, Panel, NUM } from './DeskBits';

const w = he.worker;

// פעולה ראשית אחת בכרטיס; השאר במגירה.
function primaryAction(task) {
  if (isLocked(task)) return null;
  if (task.status === 'pending' || task.status === 'scheduled')
    return { label: w.start, key: 'start' };
  if (task.status === 'in_progress') return { label: w.finish, key: 'finish' };
  if (task.status === 'paused') return { label: w.resume, key: 'resume' };
  if (task.status === 'blocked') return { label: w.unblock, key: 'unblock' };
  return null;
}

// פס ניצול זמן — ירוק עד 85%, כתום עד 100%, אדום מעל (DESIGN §10ד)
function UsageBar({ task }) {
  const est = allocatedMinutes(task);
  if (!est) return null;
  const pct = usagePercent(task);
  const tone = pct > 100 ? 'bg-statusRed' : pct > 85 ? 'bg-yellow-500' : 'bg-statusGreen';
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-xs" style={NUM}>
        <span className="text-slate-500">{formatDuration(elapsedSeconds(task))}</span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={tone + ' h-full'} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function OpenCard({ task, onOpen, onAction, busy }) {
  const act = primaryAction(task);
  const running = task.status === 'in_progress';

  return (
    <article
      className={`flex flex-col rounded-[10px] border border-line p-4 shadow-sm ${
        task.status === 'blocked' ? 'bg-red-50/40' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={task.status} live={running} />
        <StatusName status={task.status} />
        <span className="ms-auto" />
        <TaskNumber id={task.id} />
      </div>

      <button type="button" onClick={() => onOpen(task.id)} className="mt-2 text-start">
        <h3 className="text-base font-bold leading-snug text-slate-900">{task.title}</h3>
        <p className="mt-1 truncate text-xs text-slate-500">
          {[task.client?.name, task.project?.name].filter(Boolean).join(' · ')}
        </p>
      </button>

      {task.priority === 'urgent' && (
        <span className="mt-2 self-start rounded-full bg-urgentSoft px-2 py-0.5 text-[11px] font-bold text-urgentInk">
          {he.tasks.priorityOpt.urgent}
        </span>
      )}

      <UsageBar task={task} />

      {act && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction(task, act.key)}
          className="mt-4 min-h-[48px] w-full rounded-xl bg-brand px-4 font-bold text-white hover:bg-brand/90 disabled:opacity-60"
        >
          {act.label}
        </button>
      )}
    </article>
  );
}

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

export default function DeskCardsView({ open, done, onOpen, onAction, busy }) {
  return (
    <div className="space-y-4">
      <Panel title={w.openPanel} count={open.length}>
        {open.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">{w.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 bg-slate-50/60 p-4 md:grid-cols-2 xl:grid-cols-3">
            {open.map((t) => (
              <OpenCard key={t.id} task={t} onOpen={onOpen} onAction={onAction} busy={busy} />
            ))}
          </div>
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
