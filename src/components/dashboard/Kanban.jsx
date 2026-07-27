import { he } from '../../locales/he';
import KanbanColumn from './KanbanColumn';

// קנבן 4 טורים
export default function Kanban({
  cols,
  membersMap,
  blockedReasons,
  onReturnToWork,
  onManagerUpdate,
}) {
  const c = he.dashboard.columns;
  const shared = {
    membersMap,
    blockedReasons,
    onReturnToWork,
    onManagerUpdate,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <KanbanColumn title={c.waiting} tasks={cols.waiting} {...shared} />
      <KanbanColumn title={c.working} tasks={cols.working} {...shared} />
      <KanbanColumn title={c.alert} tasks={cols.alert} accent="red" {...shared} />
      <KanbanColumn title={c.doneToday} tasks={cols.done} {...shared} />
    </div>
  );
}
