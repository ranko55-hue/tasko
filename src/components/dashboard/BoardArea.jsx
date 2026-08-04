import { useState, useMemo } from 'react';
import { he } from '../../locales/he';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../../hooks/useBoardView';
import { buildDashboard } from '../../lib/dashboardModel';
import ViewToggle from '../shared/ViewToggle';
import { sortByUrgency } from '../../lib/lateness';
import TaskSummary from './TaskSummary';
import BoardRows from './BoardRows';

const d = he.dashboard;
const NUM = { fontVariantNumeric: 'tabular-nums' };

export default function BoardArea({
  cols, tasks, membersMap, blockedReasons,
  onOpenTask, onReturnToWork, currentMemberId, onRefresh,
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
    <section className="rounded-2xl border border-line bg-surface/60 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black text-grayMid">{d.areaTitle}</h2>
          {/* מסנן — שני כפתורים מפורשים, הפעיל מסומן; חל על שתי התצוגות */}
          <div className="flex items-center gap-1 rounded-lg bg-appBg p-0.5">
            <button
              type="button"
              onClick={() => setMyOnly(false)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                !myOnly ? 'bg-white text-navy shadow-sm' : 'text-grayDark hover:text-navy'
              }`}
            >
              {d.allTasks}
            </button>
            <button
              type="button"
              onClick={() => setMyOnly(true)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                myOnly ? 'bg-white text-navy shadow-sm' : 'text-grayDark hover:text-navy'
              }`}
            >
              {d.myTasksFilter}
            </button>
          </div>
        </div>

        <ViewToggle options={BOARD_VIEW_OPTIONS} view={view} onChange={choose} />
      </div>

      {view === 'rows' ? (
        <BoardRows
          tasks={filtered.tasks}
          membersMap={membersMap}
          onOpenTask={onOpenTask}
          currentMemberId={currentMemberId}
          onRefresh={onRefresh}
        />
      ) : (
        <div className="grid items-start gap-3 md:grid-cols-5">
          {order.map((key) => {
            const list = sortByUrgency(filtered.cols[key]);
            return (
              <div key={key} className="min-w-0 rounded-lg border border-drLine bg-[#f4f6f8] p-2.5">
                <h3 className="mb-2 flex items-center gap-2">
                  <span className="text-[12.5px] font-extrabold text-navy">{d.columns[key]}</span>
                  <span
                    className="rounded-md bg-drNavy px-2 py-0.5 text-[11px] font-bold text-white"
                    style={NUM}
                  >
                    {list.length}
                  </span>
                </h3>

                <div className="space-y-2">
                  {list.map((t) => (
                    <TaskSummary
                      key={t.id}
                      task={t}
                      assigneeName={membersMap[t.assignee_id]}
                      variant="card"
                      currentMemberId={currentMemberId}
                      onOpenTask={onOpenTask}
                      onRefresh={onRefresh}
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
