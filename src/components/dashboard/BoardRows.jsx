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
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {/* כותרת עמודות — sticky, דסקטופ בלבד. באותו גריד של השורות. */}
      <div className={`sticky top-[68px] z-10 hidden ${ROW_GRID} items-center gap-3 border-b border-line bg-surface py-2 pe-3 text-xs font-bold text-grayMid sm:grid`}>
        <span aria-hidden="true" />
        <span>{b.colTask}</span>
        <span>{b.colClient}</span>
        <span>{b.colAssignee}</span>
        <span className="text-center">{b.colUrgency}</span>
        <span>{b.colTimer}</span>
        <span>{b.colAction}</span>
      </div>

      {ORDER.map((key) => {
        const list = sortByUrgency(groups[key]);
        const isOpen = !!open[key];
        const hot = key === 'late' && list.length > 0;

        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              aria-expanded={isOpen}
              className={`flex min-h-touch w-full items-center gap-2 border-b border-line pe-3 text-start ${hot ? 'bg-urgentSoft' : 'bg-surface/60'}`}
            >
              <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="sm" className="text-grayLight" />
              <span className={`text-sm font-bold ${hot ? 'text-urgentInk' : 'text-navy'}`}>{LABEL[key]}</span>
              <span className="rounded-full bg-appBg px-2 py-0.5 text-xs font-bold text-grayDark" style={NUM}>{list.length}</span>
            </button>

            {isOpen && (
              list.length === 0 ? (
                <p className="border-b border-line px-3 py-3 text-xs text-grayLight">{d.groupEmpty}</p>
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
