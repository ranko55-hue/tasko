import { useState } from 'react';
import { he } from '../../locales/he';
import TaskCardManager from './TaskCardManager';
import EmptyState from '../ui/EmptyState';

// מובייל: אותו תוכן כמו הקנבן, אך צ'יפים לסינון + רשימה של קבוצה אחת בכל פעם.
export default function KanbanMobile({
  cols,
  membersMap,
  blockedReasons,
  onReturnToWork,
  onManagerUpdate,
}) {
  const c = he.dashboard.columns;
  const groups = [
    { key: 'waiting', label: c.waiting, tasks: cols.waiting },
    { key: 'working', label: c.working, tasks: cols.working },
    { key: 'alert', label: c.alert, tasks: cols.alert },
    { key: 'done', label: c.doneToday, tasks: cols.done },
  ];
  const [sel, setSel] = useState(
    groups.find((g) => g.tasks.length)?.key ?? 'working'
  );
  const active = groups.find((g) => g.key === sel);

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {groups.map((g) => {
          const on = g.key === sel;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setSel(g.key)}
              className={
                'min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-bold ' +
                (on ? 'bg-navy text-white' : 'border border-line bg-white text-slate-600')
              }
            >
              {g.label} · {g.tasks.length}
            </button>
          );
        })}
      </div>

      {active.tasks.length === 0 ? (
        <EmptyState emoji="✅" message={he.dashboard.columnEmpty} />
      ) : (
        <div className="space-y-3">
          {active.tasks.map((t) => (
            <TaskCardManager
              key={t.id}
              task={t}
              assigneeName={membersMap[t.assignee_id]}
              blockedReason={blockedReasons[t.id]}
              onReturnToWork={onReturnToWork}
              onManagerUpdate={onManagerUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
