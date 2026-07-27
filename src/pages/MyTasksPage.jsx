import { useOrg } from '../lib/orgContext';
import { useMyTasks } from '../hooks/useMyTasks';
import { he } from '../locales/he';
import PageShell from '../components/ui/PageShell';
import PageHeader from '../components/ui/PageHeader';
import MyTaskList from '../components/worker/MyTaskList';

// מסך העובד — "המשימות שלי" (עובד / ראש צוות; מנהל יכול לצפות גם)
export default function MyTasksPage() {
  const { member } = useOrg();
  const { tasks, loading, applyLocal } = useMyTasks(member.id);

  return (
    <PageShell>
      <PageHeader title={he.worker.title} />

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <MyTaskList tasks={tasks} onUpdated={applyLocal} />
      )}
    </PageShell>
  );
}
