import { he } from '../../locales/he';
import { STATUS_STYLES, PRIORITY_STYLES } from '../../lib/taskMeta';
import Badge from '../shared/Badge';
import Button from '../shared/Button';

function formatDue(due) {
  if (!due) return he.tasks.noDueDate;
  const d = new Date(due);
  return d.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// רשימת משימות בפרויקט — כותרת, סטטוס, משויך, יעד.
// למשימה חסומה: מציג סיבת עיכוב + כפתור החזרה לעבודה (למנהל).
export default function TaskList({ tasks, members, reasons = {}, onReturnToWork }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-lg text-slate-500 shadow-sm">
        {he.tasks.empty}
      </p>
    );
  }

  const nameOf = (id) =>
    members.find((m) => m.id === id)?.full_name ?? he.tasks.unassigned;

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-lg font-bold text-slate-900">{task.title}</div>
            <Badge
              label={he.tasks.status[task.status] ?? task.status}
              className={STATUS_STYLES[task.status] ?? ''}
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
            <span>{nameOf(task.assignee_id)}</span>
            <span>·</span>
            <span>{formatDue(task.due_at)}</span>
            {task.priority === 'urgent' && (
              <Badge
                label={he.tasks.priorityOpt.urgent}
                className={PRIORITY_STYLES.urgent}
              />
            )}
          </div>

          {task.status === 'blocked' && (
            <div className="mt-3 rounded-xl bg-red-50 p-3">
              <div className="text-sm font-bold text-red-700">
                {he.tasks.blockReason}
              </div>
              <div className="mb-3 text-red-900">
                {reasons[task.id] || he.common.none}
              </div>
              {onReturnToWork && (
                <Button variant="outline" onClick={() => onReturnToWork(task)}>
                  {he.tasks.returnToWork}
                </Button>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
