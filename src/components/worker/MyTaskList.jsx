import { he } from '../../locales/he';
import EmptyState from '../ui/EmptyState';
import MyTaskItem from './MyTaskItem';

export default function MyTaskList({ tasks, onUpdated }) {
  if (tasks.length === 0) {
    return <EmptyState emoji="🙌" message={he.worker.empty} />;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <MyTaskItem key={task.id} task={task} onUpdated={onUpdated} />
      ))}
    </ul>
  );
}
