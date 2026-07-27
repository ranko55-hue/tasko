import { he } from '../../locales/he';
import MyTaskItem from './MyTaskItem';

export default function MyTaskList({ tasks, onUpdated }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-lg text-slate-500 shadow-sm">
        {he.worker.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <MyTaskItem key={task.id} task={task} onUpdated={onUpdated} />
      ))}
    </ul>
  );
}
