import { useOrg } from '../lib/orgContext';
import { useMyTasks } from '../hooks/useMyTasks';
import { he } from '../locales/he';
import MyTaskList from '../components/worker/MyTaskList';

// מסך העובד — "המשימות שלי" (עובד / ראש צוות; מנהל יכול לצפות גם)
export default function MyTasksPage() {
  const { member } = useOrg();
  const { tasks, loading, applyLocal } = useMyTasks(member.id);

  return (
    <div>
      <h1 className="mb-5 text-3xl font-extrabold text-slate-900">
        {he.worker.title}
      </h1>

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <MyTaskList tasks={tasks} onUpdated={applyLocal} />
      )}
    </div>
  );
}
