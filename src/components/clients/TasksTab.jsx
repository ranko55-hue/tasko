import { he } from '../../locales/he';
import Row from '../ui/Row';
import StatusPill, { STATUS_TONE } from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import TabSection from './TabSection';

const CLOSED = ['done', 'cancelled'];

// לשונית משימות — פתוחות / סגורות. Row משותפת. לחיצה פותחת את הפרויקט של המשימה.
export default function TasksTab({ tasks, members, onOpenTask }) {
  const t = he.clientDetail.tasksTab;
  if (!tasks.length) return <EmptyState emoji="📋" message={t.empty} />;

  const nameOf = (id) =>
    members.find((m) => m.id === id)?.full_name ?? he.tasks.unassigned;
  const open = tasks.filter((x) => !CLOSED.includes(x.status));
  const closed = tasks.filter((x) => CLOSED.includes(x.status));

  const row = (x) => (
    <Row
      key={x.id}
      icon="📋"
      title={x.title}
      subtitle={nameOf(x.assignee_id)}
      trailing={
        <StatusPill
          tone={STATUS_TONE[x.status]}
          label={he.tasks.status[x.status] ?? x.status}
        />
      }
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
