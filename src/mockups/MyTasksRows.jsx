import { mkMy } from './myTasksStrings';
import { OPEN_TASKS, DONE_TASKS, fmtDuration, fmtEst } from './myTasksMockData';
import { StatusDot, StatusName, TaskNumber, Panel, ActionButton, NUM } from './MyTasksBits';

// פעולת ההקשר של השורה — פעולה אחת לפי מצב, לא סרגל שלם.
function rowAction(status) {
  if (status === 'in_progress') return { label: mkMy.actions.finish, tone: 'brand' };
  if (status === 'pending') return { label: mkMy.actions.start, tone: 'brand' };
  if (status === 'blocked') return { label: mkMy.actions.unblock, tone: 'outline' };
  return null;
}

function OpenRow({ task }) {
  const act = rowAction(task.status);
  const running = task.status === 'in_progress';

  return (
    <div
      className={`flex items-center gap-3 border-b border-line px-4 py-3 last:border-0 ${
        task.status === 'blocked' ? 'bg-red-50/60' : 'hover:bg-slate-50'
      }`}
    >
      <StatusDot status={task.status} />

      <div className="w-[4.5rem] shrink-0">
        <StatusName status={task.status} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-bold text-slate-900">{task.title}</span>
          {task.priority === 'urgent' && (
            <span className="shrink-0 rounded-full bg-urgentSoft px-2 py-0.5 text-[11px] font-bold text-urgentInk">
              {mkMy.labels.urgent}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-slate-500">
          {task.client} · {task.project}
        </div>
        {task.status === 'blocked' && (
          <p className="mt-1 border-e-2 border-red-300 pe-2 text-xs italic text-slate-600">
            {task.blockReason}
          </p>
        )}
      </div>

      <div className="hidden w-24 shrink-0 text-xs text-slate-500 lg:block" style={NUM}>
        {mkMy.labels.due} {task.due}
      </div>

      <div className="w-28 shrink-0 text-end text-xs" style={NUM}>
        {running ? (
          <span className="font-bold text-statusGreen">{fmtDuration(task.netSeconds)}</span>
        ) : (
          <span className="text-slate-400">
            {fmtDuration(task.netSeconds)} / {fmtEst(task.estMinutes)}
          </span>
        )}
      </div>

      <TaskNumber id={task.id} />

      <div className="w-28 shrink-0 text-end">
        {act && <ActionButton label={act.label} tone={act.tone} />}
      </div>
    </div>
  );
}

// משימה שהושלמה — דחוסה, בלי טיימר ובלי כפתורי פעולה.
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

// חלופה 1 — שורות בשפת תצוגת השורות של הלוח.
export default function MyTasksRows() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Panel title={mkMy.panel.openTitle} count={OPEN_TASKS.length}>
        {OPEN_TASKS.map((t) => (
          <OpenRow key={t.id} task={t} />
        ))}
      </Panel>

      <Panel title={mkMy.panel.doneTitle} count={DONE_TASKS.length} muted>
        {DONE_TASKS.map((t) => (
          <DoneRow key={t.id} task={t} />
        ))}
      </Panel>

      <p className="px-1 text-xs text-slate-400">{mkMy.labels.drawerHint}</p>
    </div>
  );
}
