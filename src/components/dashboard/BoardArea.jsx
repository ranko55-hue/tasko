import { useMemo } from 'react';
import { he } from '../../locales/he';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../../hooks/useBoardView';
import { useBoardFilter, BOARD_FILTER_OPTIONS } from '../../hooks/useBoardFilter';
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
  const [filter, chooseFilter] = useBoardFilter();
  const myOnly = filter === 'mine';

  const filtered = useMemo(() => {
    if (!myOnly || !currentMemberId) return { cols, tasks };
    // "המשימות שלי" = משימות שהמשתמש נוגע בהן — מבצע או ראש צוות (כמו ב-RLS).
    const mine = tasks.filter(
      (t) => t.assignee_id === currentMemberId || t.team_lead_id === currentMemberId,
    );
    const doneTodayIds = cols.done.map((t) => t.id);
    return { cols: buildDashboard(mine, doneTodayIds).cols, tasks: mine };
  }, [myOnly, currentMemberId, cols, tasks]);

  const order = ['waiting', 'working', 'alert', 'approval', 'done'];

  return (
    <section className="rounded-2xl border border-line bg-surface/60 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-4">
          {/* כותרת מקטע בלבד — לא לחיץ, בלי רקע/מסגרת/hover */}
          <h2 className="text-[15px] font-extrabold text-navy">{d.areaTitle}</h2>
          {/* מסנן — segmented control זהה למתג שורות/עמודות; חל על שתי התצוגות */}
          <ViewToggle options={BOARD_FILTER_OPTIONS} view={filter} onChange={chooseFilter} />
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
