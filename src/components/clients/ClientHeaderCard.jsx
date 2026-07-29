import { he } from '../../locales/he';
import Icon from '../ui/Icon';

function initials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}

// כותרת כרטיס הלקוח: אריח navy עם ראשי תיבות + שם + שורת סטטוס אפורה + כפתור משימה חדשה.
export default function ClientHeaderCard({ client, openProjects, openTasks, onNewTask }) {
  const c = he.clientDetail;
  const statusWord = client?.is_active === false ? c.inactive : c.active;
  const statusLine = c.statusLine
    .replace('{status}', statusWord)
    .replace('{projects}', openProjects)
    .replace('{tasks}', openTasks);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-line p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy text-2xl font-black text-white">
          {initials(client?.name) || <Icon name="client" size="lg" />}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black text-slate-900">
            {client?.name ?? he.common.loading}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{statusLine}</p>
        </div>
      </div>
      {onNewTask && (
        <button
          type="button"
          onClick={onNewTask}
          className="min-h-touch shrink-0 rounded-lg bg-brandYellow px-4 py-2 font-bold text-navy hover:bg-brandYellow/90"
        >
          {he.dashboard.newTask}
        </button>
      )}
    </div>
  );
}
