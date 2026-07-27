import { useState } from 'react';
import { he } from '../../locales/he';
import { STATUS_STYLES } from '../../lib/taskMeta';
import { formatDateTime } from '../../lib/time';
import Badge from '../shared/Badge';
import MyTaskCard from './MyTaskCard';

const ACTIVE = ['in_progress', 'paused', 'blocked'];

// פריט משימה — פעילה נפתחת אוטומטית, אחרת מכווצת (נגיעה פותחת).
export default function MyTaskItem({ task, onUpdated }) {
  const [open, setOpen] = useState(ACTIVE.includes(task.status));

  return (
    <li className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 p-4 text-right"
      >
        <div>
          <div className="text-lg font-bold text-slate-900">{task.title}</div>
          <div className="mt-1 text-slate-500">
            {formatDateTime(task.due_at) ?? he.worker.noDue}
            {task.project?.name ? ` · ${task.project.name}` : ''}
          </div>
        </div>
        <Badge
          label={he.tasks.status[task.status] ?? task.status}
          className={STATUS_STYLES[task.status] ?? ''}
        />
      </button>

      {open && <MyTaskCard task={task} onUpdated={onUpdated} />}
    </li>
  );
}
