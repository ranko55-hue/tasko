import { he } from '../../locales/he';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../../hooks/useBoardView';
import ViewToggle from '../shared/ViewToggle';
import { sortByUrgency } from '../../lib/lateness';
import DashboardTaskCard from './DashboardTaskCard';
import BoardRows from './BoardRows';

const d = he.dashboard;
const NUM = { fontVariantNumeric: 'tabular-nums' };
// אזור המשימות — מסגרת אחת עם כותרת ומתג תצוגה. הבחירה נשמרת פר משתמש.
export default function BoardArea({ cols, tasks, membersMap, blockedReasons, onOpenTask, onReturnToWork }) {
  const [view, choose] = useBoardView();

  const order = ['waiting', 'working', 'alert', 'done'];

  return (
    <section className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <h2 className="text-sm font-black text-slate-500">{d.areaTitle}</h2>

        <ViewToggle options={BOARD_VIEW_OPTIONS} view={view} onChange={choose} />
      </div>

      {view === 'rows' ? (
        <BoardRows tasks={tasks} membersMap={membersMap} onOpenTask={onOpenTask} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {order.map((key) => {
            const list = sortByUrgency(cols[key]);
            return (
              <div key={key} className="min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  <h3
                    className={`font-bold ${
                      key === 'alert' ? 'text-statusRed' : 'text-slate-900'
                    }`}
                  >
                    {d.columns[key]}
                  </h3>
                  <span
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600"
                    style={NUM}
                  >
                    {list.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {list.map((t) => (
                    <DashboardTaskCard
                      key={t.id}
                      task={t}
                      assigneeName={membersMap[t.assignee_id]}
                      blockedReason={blockedReasons[t.id]}
                      onOpenTask={onOpenTask}
                      onReturnToWork={onReturnToWork}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
