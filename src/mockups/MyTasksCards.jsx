import { mkMy } from './myTasksStrings';
import { OPEN_TASKS, DONE_TASKS, fmtDuration, fmtEst } from './myTasksMockData';
import { StatusDot, StatusName, TaskNumber, Panel, ActionButton, NUM } from './MyTasksBits';

// הפעולה הראשית של הכרטיס — אחת בלבד; השאר במגירה.
function primaryAction(status) {
  if (status === 'in_progress') return { label: mkMy.actions.finish, tone: 'brand' };
  if (status === 'pending') return { label: mkMy.actions.start, tone: 'brand' };
  if (status === 'blocked') return { label: mkMy.actions.unblock, tone: 'outline' };
  return null;
}

// פס ניצול זמן — ירוק עד 85%, כתום עד 100%, אדום מעל (DESIGN §10ד)
function UsageBar({ netSeconds, estMinutes }) {
  if (!estMinutes) return null;
  const ratio = netSeconds / (estMinutes * 60);
  const pct = Math.min(100, Math.round(ratio * 100));
  const tone =
    ratio > 1 ? 'bg-statusRed' : ratio > 0.85 ? 'bg-yellow-500' : 'bg-statusGreen';
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between text-xs" style={NUM}>
        <span className="text-slate-500">
          {fmtDuration(netSeconds)} / {fmtEst(estMinutes)}
        </span>
        <span className="text-slate-400">{pct}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function OpenCard({ task }) {
  const act = primaryAction(task.status);

  return (
    <article
      className={`flex flex-col rounded-[10px] border border-line bg-white p-4 shadow-sm ${
        task.status === 'blocked' ? 'bg-red-50/40' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={task.status} />
        <StatusName status={task.status} />
        <span className="ms-auto" />
        <TaskNumber id={task.id} />
      </div>

      <h3 className="mt-2 text-base font-bold leading-snug text-slate-900">{task.title}</h3>
      <p className="mt-1 truncate text-xs text-slate-500">
        {task.client} · {task.project}
      </p>

      {task.status === 'blocked' && (
        <p className="mt-2 border-e-2 border-red-300 pe-2 text-xs italic text-slate-600">
          {task.blockReason}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-2 text-xs" style={NUM}>
        <span className="text-slate-500">
          {mkMy.labels.due} {task.due}
        </span>
        <span className="text-slate-500">
          {mkMy.labels.est} {fmtEst(task.estMinutes)}
        </span>
        {task.priority === 'urgent' && (
          <span className="rounded-full bg-urgentSoft px-2 py-0.5 text-[11px] font-bold text-urgentInk">
            {mkMy.labels.urgent}
          </span>
        )}
      </div>

      <UsageBar netSeconds={task.netSeconds} estMinutes={task.estMinutes} />

      {act && (
        <div className="mt-4">
          <ActionButton label={act.label} tone={act.tone} size="lg" />
        </div>
      )}
    </article>
  );
}

// הושלמה — שורה דחוסה בתוך הפאנל, בלי טיימר ובלי פעולות.
function DoneRow({ task }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-2 last:border-0">
      <StatusDot status="done" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-500">{task.title}</span>
      <span className="hidden truncate text-xs text-slate-400 lg:block">{task.client}</span>
      <span className="w-16 shrink-0 text-end text-xs text-slate-400" style={NUM}>
        {task.due}
      </span>
      <TaskNumber id={task.id} />
    </div>
  );
}

// חלופה 2 — גריד כרטיסים מאופקים ברוחב קבוע, בשפת כרטיסי הלוח.
export default function MyTasksCards() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Panel title={mkMy.panel.openTitle} count={OPEN_TASKS.length}>
        <div className="grid grid-cols-1 gap-4 bg-slate-50/60 p-4 md:grid-cols-2 xl:grid-cols-3">
          {OPEN_TASKS.map((t) => (
            <OpenCard key={t.id} task={t} />
          ))}
        </div>
      </Panel>

      <Panel title={mkMy.panel.doneTitle} count={DONE_TASKS.length} muted>
        {DONE_TASKS.map((t) => (
          <DoneRow key={t.id} task={t} />
        ))}
      </Panel>

      <p className="px-1 text-xs text-slate-400">{mkMy.labels.primaryHint}</p>
    </div>
  );
}
