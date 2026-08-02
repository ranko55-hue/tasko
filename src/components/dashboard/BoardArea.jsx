import { useState, useMemo } from 'react';
import { he } from '../../locales/he';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../../hooks/useBoardView';
import { buildDashboard } from '../../lib/dashboardModel';
import ViewToggle from '../shared/ViewToggle';
import { sortByUrgency } from '../../lib/lateness';
import DashboardTaskCard from './DashboardTaskCard';
import BoardRows from './BoardRows';

const d = he.dashboard;
const NUM = { fontVariantNumeric: 'tabular-nums' };

export default function BoardArea({
  cols, tasks, membersMap, blockedReasons,
  onOpenTask, onReturnToWork, currentMemberId,
}) {
  const [view, choose] = useBoardView();
  const [myOnly, setMyOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!myOnly || !currentMemberId) return { cols, tasks };
    const mine = tasks.filter((t) => t.assignee_id === currentMemberId);
    const doneTodayIds = cols.done.map((t) => t.id);
    return { cols: buildDashboard(mine, doneTodayIds).cols, tasks: mine };
  }, [myOnly, currentMemberId, cols, tasks]);

  const order = ['waiting', 'working', 'alert', 'approval', 'done'];

  return (
    <section className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-500">{d.areaTitle}</h2>
          <button
            type="button"
            onClick={() => setMyOnly((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
              myOnly
                ? 'bg-brand text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {myOnly ? d.myTasksFilter : d.allTasks}
          </button>
        </div>

        <ViewToggle options={BOARD_VIEW_OPTIONS} view={view} onChange={choose} />
      </div>

      {view === 'rows' ? (
        <BoardRows tasks={filtered.tasks} membersMap={membersMap} onOpenTask={onOpenTask} />
      ) : (
        <div className="grid gap-4 md:grid-cols-5">
          {order.map((key) => {
            const list = sortByUrgency(filtered.cols[key]);
            return (
              <div key={key} className="min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  <h3
                    className={`font-bold ${
                      key === 'alert' ? 'text-statusRed' : key === 'approval' ? 'text-purple-700' : 'text-slate-900'
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
