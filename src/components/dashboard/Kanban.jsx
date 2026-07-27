import { he } from '../../locales/he';
import KanbanColumn from './KanbanColumn';
import KanbanMobile from './KanbanMobile';

// מסך אחד, שני מצבים: דסקטופ 4 טורים · מובייל צ'יפים + רשימה. אותו תוכן ופעולות.
export default function Kanban({
  cols,
  membersMap,
  blockedReasons,
  onReturnToWork,
  onManagerUpdate,
}) {
  const c = he.dashboard.columns;
  const shared = { membersMap, blockedReasons, onReturnToWork, onManagerUpdate };

  return (
    <>
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        <KanbanColumn title={c.waiting} tasks={cols.waiting} {...shared} />
        <KanbanColumn title={c.working} tasks={cols.working} {...shared} />
        <KanbanColumn title={c.alert} tasks={cols.alert} accent="red" {...shared} />
        <KanbanColumn title={c.doneToday} tasks={cols.done} {...shared} />
      </div>

      <div className="md:hidden">
        <KanbanMobile cols={cols} {...shared} />
      </div>
    </>
  );
}
