import { useState } from 'react';
import { he } from '../../locales/he';
import { lateness, sortByUrgency } from '../../lib/lateness';
import { STATUS_DOT } from '../ui/StatusPill';
import { dateRangeLabel, isMultiDay } from '../../lib/taskDates';
import Icon from '../ui/Icon';

const d = he.dashboard;
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
  late: d.groupLate,
  working: d.groupWorking,
  waiting: d.groupWaiting,
  blocked: d.groupBlocked,
  approval: d.groupApproval,
  done: d.groupDone,
};

function LateTag({ task }) {
  const late = lateness(task);
  if (!late) return null;
  const severe = late === 'unassigned';
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ${
        severe ? 'bg-statusRed text-white' : 'border border-statusRed/40 bg-urgentSoft text-urgentInk'
      }`}
    >
      {severe ? d.lateUnassigned : d.lateWorking}
    </span>
  );
}

// תצוגת שורות — קבוצות מתקפלות, שורה דחוסה, לחיצה פותחת את מגירת המשימה.
export default function BoardRows({ tasks, membersMap, onOpenTask }) {
  const [open, setOpen] = useState({ late: true, working: true, waiting: true });

  const groups = { late: [], working: [], waiting: [], blocked: [], approval: [], done: [] };
  (tasks ?? []).forEach((t) => groups[groupOf(t)].push(t));

  return (
    <div className="space-y-3">
      {ORDER.map((key) => {
        const list = sortByUrgency(groups[key]);
        const isOpen = !!open[key];
        const hot = key === 'late' && list.length > 0;

        return (
          <div
            key={key}
            className={`overflow-hidden rounded-xl border bg-white ${
              hot ? 'border-statusRed/40' : 'border-line'
            }`}
          >
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
              aria-expanded={isOpen}
              className={`flex min-h-touch w-full items-center gap-2 px-3 text-start ${
                hot ? 'bg-urgentSoft' : 'bg-surface'
              }`}
            >
              <Icon
                name={isOpen ? 'chevronUp' : 'chevronDown'}
                size="sm"
                className="text-grayLight"
              />
              <span className={`text-sm font-bold ${hot ? 'text-urgentInk' : 'text-navy'}`}>
                {LABEL[key]}
              </span>
              <span
                className="rounded-full bg-appBg px-2 py-1 text-xs font-bold text-grayDark"
                style={NUM}
              >
                {list.length}
              </span>
            </button>

            {isOpen && (
              <div>
                {list.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-grayLight">{d.groupEmpty}</p>
                ) : (
                  list.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask?.(task.id)}
                      className={`flex min-h-touch w-full items-center gap-3 border-b border-line px-3 py-2 text-start transition-colors last:border-0 ${
                        lateness(task) ? 'bg-urgentSoft/60 hover:bg-urgentSoft' : 'hover:bg-surface'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          STATUS_DOT[task.status] ?? 'bg-grayLight'
                        }`}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">
                        {task.title}
                      </span>
                      <span className="hidden max-w-36 truncate text-xs text-grayMid sm:block">
                        {task.client?.name ?? he.common.none}
                      </span>
                      <span className="hidden w-24 shrink-0 truncate text-xs text-grayMid md:block">
                        {membersMap?.[task.assignee_id] ?? he.tasks.unassigned}
                      </span>
                      <span
                        className={`w-20 shrink-0 text-end text-xs ${
                          isMultiDay(task) ? 'text-inkSoft' : 'text-grayMid'
                        }`}
                        style={NUM}
                      >
                        {dateRangeLabel(task) ?? he.common.none}
                      </span>
                      <LateTag task={task} />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
