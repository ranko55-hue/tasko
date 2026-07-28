import { he } from '../../locales/he';
import TaskCardManager from './TaskCardManager';

// טור בקנבן — כותרת, מונה, וכרטיסים (או מצב ריק)
export default function KanbanColumn({
  title,
  tasks,
  accent = 'slate',
  membersMap,
  blockedReasons,
  onReturnToWork,
  onManagerUpdate,
  onOpenTask,
}) {
  const accentDot = accent === 'red' ? 'bg-statusRed' : 'bg-slate-400';

  return (
    <section className="rounded-2xl bg-slate-200/60 p-3">
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${accentDot}`} />
        <h2 className="font-black text-slate-700">{title}</h2>
        <span className="rounded-full bg-white px-2 text-sm font-bold text-slate-500">
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="px-1 py-4 text-center text-sm text-slate-400">
          {he.dashboard.columnEmpty}
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <TaskCardManager
              key={t.id}
              task={t}
              assigneeName={membersMap[t.assignee_id]}
              blockedReason={blockedReasons[t.id]}
              onReturnToWork={onReturnToWork}
              onManagerUpdate={onManagerUpdate}
              onOpenTask={onOpenTask}
            />
          ))}
        </div>
      )}
    </section>
  );
}
