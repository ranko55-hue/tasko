import { useState } from 'react';
import { he } from '../../locales/he';
import { lateness, sortByUrgency } from '../../lib/lateness';
import Icon from '../ui/Icon';
import TaskSummary, { ROW_GRID } from './TaskSummary';

const d = he.dashboard;
const b = d.board;
const NUM = { fontVariantNumeric: 'tabular-nums' };
const CLOSED = ['done', 'cancelled'];

// קבוצת "באיחור" קודמת לכול; שאר הקבוצות לפי מצב העבודה.
function groupOf(task) {
  if (lateness(task)) return 'late';
  if (CLOSED.includes(task.status)) return 'done';
  if (task.status === 'blocked') return 'blocked';
  if (task.status === 'pending_approval') return 'approval';
  if (['in_progress', 'paused'].includes(task.status)) return 'working';
  return 'waiting';
}

const ORDER = ['late', 'working', 'waiting', 'blocked', 'approval', 'done'];
const LABEL = {
  late: d.groupLate, working: d.groupWorking, waiting: d.groupWaiting,
  blocked: d.groupBlocked, approval: d.groupApproval, done: d.groupDone,
};

// תצוגת שורות — כותרת עמודות אחת sticky, קבוצות מתקפלות, שורה משותפת (TaskSummary).
export default function BoardRows({ tasks, membersMap, onOpenTask, currentMemberId, onRefresh }) {
  const [open, setOpen] = useState({ late: true, working: true, waiting: true });

  const groups = { late: [], working: [], waiting: [], blocked: [], approval: [], done: [] };
  (tasks ?? []).forEach((t) => groups[groupOf(t)].push(t));

  return (
    <div>
      {/* כותרת עמודות — אלמנט עצמאי, מחוץ לכל הקבוצות, sticky. דסקטופ בלבד. */}
      <div className={`sticky top-[68px] z-10 mb-[10px] hidden ${ROW_GRID} min-h-[36px] items-center rounded-lg border border-drLine bg-[#f4f6f8] px-[14px] text-[11px] font-extrabold tracking-wide text-grayMid sm:grid`}>
        <span aria-hidden="true" />
        <span>{b.colTask}</span>
        <span>{b.colClient}</span>
        <span>{b.colAssignee}</span>
        <span className="text-center">{b.colUrgency}</span>
        <span>{b.colTimer}</span>
        <span>{b.colAction}</span>
      </div>

      {/* קבוצות — כל קבוצה קונטיינר עצמאי, קיפול עצמאי. */}
      {ORDER.map((key) => {
        const list = sortByUrgency(groups[key]);
        const isOpen = !!open[key];
        const hot = key === 'late' && list.length > 0;

        return (
          <div key={key} className={`mb-3 overflow-hidden rounded-lg border bg-white ${hot ? 'border-drRed/40' : 'border-drLine'}`}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              aria-expanded={isOpen}
              className={`flex min-h-touch w-full items-center gap-2 border-b border-drLine px-4 text-start ${hot ? 'bg-urgentSoft' : 'bg-surface'}`}
            >
              <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="sm" className="text-grayLight" />
              <span className={`text-sm font-bold ${hot ? 'text-urgentInk' : 'text-navy'}`}>{LABEL[key]}</span>
              <span className="rounded-md bg-drNavy px-2 py-0.5 text-[11px] font-bold text-white" style={NUM}>{list.length}</span>
            </button>

            {isOpen && (
              list.length === 0 ? (
                <p className="px-4 py-3 text-xs text-grayLight">{d.groupEmpty}</p>
              ) : (
                list.map((task) => (
                  <TaskSummary
                    key={task.id}
                    task={task}
                    assigneeName={membersMap?.[task.assignee_id]}
                    variant="row"
                    currentMemberId={currentMemberId}
                    onOpenTask={onOpenTask}
                    onRefresh={onRefresh}
                  />
                ))
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
