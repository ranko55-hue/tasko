import { he } from '../../locales/he';
import { STATUS_STYLES } from '../../lib/taskMeta';
import DetailRow from './DetailRow';
import TabSection from './TabSection';

const CLOSED = ['done', 'cancelled'];

// לשונית משימות — פתוחות / סגורות. שורה משותפת (DetailRow). לחיצה פותחת את הפרויקט של המשימה.
export default function TasksTab({ tasks, members, onOpenTask }) {
  const t = he.clientDetail.tasksTab;
  if (!tasks.length)
    return <p className="py-8 text-center text-slate-400">{t.empty}</p>;

  const nameOf = (id) =>
    members.find((m) => m.id === id)?.full_name ?? he.tasks.unassigned;
  const open = tasks.filter((x) => !CLOSED.includes(x.status));
  const closed = tasks.filter((x) => CLOSED.includes(x.status));

  const row = (x) => (
    <DetailRow
      key={x.id}
      icon="📋"
      title={x.title}
      subtitle={nameOf(x.assignee_id)}
      tagLabel={he.tasks.status[x.status] ?? x.status}
      tagClass={STATUS_STYLES[x.status] ?? ''}
      onClick={() => onOpenTask(x)}
    />
  );

  return (
    <div className="space-y-6">
      <TabSection title={t.open.replace('{n}', open.length)}>
        {open.map(row)}
      </TabSection>
      {closed.length > 0 && (
        <TabSection title={t.closed.replace('{n}', closed.length)}>
          {closed.map(row)}
        </TabSection>
      )}
    </div>
  );
}
