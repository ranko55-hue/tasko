import { he } from '../../../locales/he';
import { isLocked, elapsedSeconds } from '../../../lib/taskFlow';
import { formatDuration } from '../../../lib/time';
import { allocatedMinutes, usagePercent } from '../../../lib/taskTime';
import Button from '../../shared/Button';
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
  const tone = pct > 100 ? 'bg-statusRed' : pct > 85 ? 'bg-brandYellow' : 'bg-statusGreen';
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-xs" style={NUM}>
        <span className="text-grayMid">{formatDuration(elapsedSeconds(task))}</span>
        <span className="text-grayLight">{pct}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-appBg">
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
        task.status === 'blocked' ? 'bg-urgentSoft/40' : 'bg-white'
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={task.status} live={running} />
        <StatusName status={task.status} />
        <span className="ms-auto" />
        <TaskNumber id={task.id} />
      </div>

      <button type="button" onClick={() => onOpen(task.id)} className="mt-2 text-start">
        <h3 className="text-base font-bold leading-snug text-navy">{task.title}</h3>
        <p className="mt-1 truncate text-xs text-grayMid">
          {[task.client?.name, task.project?.name].filter(Boolean).join(' · ')}
        </p>
      </button>

      {task.priority === 'urgent' && (
        <span className="mt-2 self-start rounded-full bg-urgentSoft px-2 py-1 text-xs font-bold text-urgentInk">
          {he.tasks.priorityOpt.urgent}
        </span>
      )}

      <UsageBar task={task} />

      {act && (
        <Button className="mt-4" disabled={busy} onClick={() => onAction(task, act.key)}>
          {act.label}
        </Button>
      )}
    </article>
  );
}

function DoneRow({ task, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="flex min-h-touch w-full items-center gap-3 border-b border-line px-4 py-2 text-start last:border-0 hover:bg-surface"
    >
      <StatusDot status="done" />
      <span className="min-w-0 flex-1 truncate text-sm text-grayMid">{task.title}</span>
      <span className="hidden truncate text-xs text-grayLight lg:block">
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
          <p className="px-4 py-6 text-center text-sm text-grayLight">{w.empty}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 bg-surface/60 p-4 md:grid-cols-2 xl:grid-cols-3">
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

      <p className="px-1 text-xs text-grayLight">{w.drawerHint}</p>
    </div>
  );
}
