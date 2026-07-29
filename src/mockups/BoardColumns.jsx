import { mk } from './mockStrings';
import { MOCK_TASKS, sortByUrgency, lateness, dateLabel, isMultiDay, CLOSED } from './mockData';
import { LateBadge, StatusDot, Count } from './MockBits';

const NUM = { fontVariantNumeric: 'tabular-nums' };

function bucket(t) {
  if (CLOSED.includes(t.status)) return 'done';
  if (t.status === 'blocked') return 'alert';
  if (['in_progress', 'paused'].includes(t.status)) return 'working';
  return 'waiting';
}

// כרטיס דחוס לטור
function Card({ task }) {
  const late = lateness(task);
  return (
    <div
      className={`rounded-lg border bg-white p-2.5 ${
        late ? 'border-statusRed/40 bg-red-50/60' : 'border-line'
      }`}
    >
      <div className="flex items-center gap-2">
        <StatusDot status={task.status} />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
          {task.title}
        </span>
      </div>
      <div className="mt-1 truncate text-xs text-slate-500">{task.client}</div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
          {task.assignee ?? mk.board.unassigned}
        </span>
        <span
          className={`shrink-0 text-xs ${isMultiDay(task) ? 'text-slate-700' : 'text-slate-500'}`}
          style={NUM}
        >
          {dateLabel(task)}
        </span>
      </div>
      <div className="mt-1.5">
        <LateBadge task={task} />
      </div>
    </div>
  );
}

// חלופה 1 — הקנבן הנוכחי, עטוף במסגרת שתוחמת את כל אזור המשימות.
export default function BoardColumns() {
  const cols = { waiting: [], working: [], alert: [], done: [] };
  MOCK_TASKS.forEach((t) => cols[bucket(t)].push(t));

  const order = ['waiting', 'working', 'alert', 'done'];

  return (
    <section className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
      <h3 className="mb-3 px-1 text-sm font-black text-slate-500">{mk.board.areaTitle}</h3>

      <div className="grid gap-3 md:grid-cols-4">
        {order.map((key) => {
          const list = sortByUrgency(cols[key]);
          return (
            <div key={key} className="min-w-0">
              <div className="mb-2 flex items-center gap-2 px-1">
                <h4
                  className={`text-sm font-bold ${
                    key === 'alert' ? 'text-statusRed' : 'text-slate-900'
                  }`}
                >
                  {mk.board.columns[key]}
                </h4>
                <Count n={list.length} />
              </div>

              <div className="space-y-2">
                {list.length === 0 ? (
                  <p className="px-1 text-xs text-slate-400">{mk.board.empty}</p>
                ) : (
                  list.map((t) => <Card key={t.id} task={t} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
