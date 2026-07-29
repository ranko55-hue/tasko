import { he } from '../../locales/he';
import { STATUS_TONE } from '../ui/StatusPill';
import { formatDateTime } from '../../lib/time';
import Row from '../ui/Row';
import StatusPill from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import Button from '../shared/Button';
import Icon from '../ui/Icon';

// רשימת משימות בפרויקט — Row משותפת. למשימה חסומה: סיבת עיכוב + החזרה לעבודה (למנהל).
export default function TaskList({ tasks, members, reasons = {}, onReturnToWork, onOpenTask }) {
  if (tasks.length === 0) {
    return <EmptyState icon="task" message={he.tasks.empty} />;
  }

  const nameOf = (id) =>
    members.find((m) => m.id === id)?.full_name ?? he.tasks.unassigned;

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="space-y-2">
          <Row
            icon={<Icon name="task" />}
            title={task.title}
            subtitle={`${nameOf(task.assignee_id)} · ${formatDateTime(task.due_at) ?? he.tasks.noDueDate}`}
            onClick={onOpenTask ? () => onOpenTask(task.id) : undefined}
            trailing={
              <div className="flex flex-col items-end gap-1">
                {task.priority === 'urgent' && (
                  <StatusPill tone="red" label={he.tasks.priorityOpt.urgent} />
                )}
                <StatusPill
                  tone={STATUS_TONE[task.status]}
                  label={he.tasks.status[task.status] ?? task.status}
                />
              </div>
            }
          />

          {task.status === 'blocked' && (
            <div className="rounded-xl bg-red-50 p-3">
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
        </div>
      ))}
    </div>
  );
}
