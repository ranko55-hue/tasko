import { he } from '../../locales/he';
import Button from '../shared/Button';
import Icon from '../ui/Icon';
import RefNumber from '../shared/RefNumber';

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
    <div className="flex items-center justify-between gap-4 border-b border-line p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-navy text-2xl font-black text-white">
          {initials(client?.name) || <Icon name="client" size="lg" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <h1 className="min-w-0 truncate text-2xl font-black text-navy">
              {client?.name ?? he.common.loading}
            </h1>
            <RefNumber value={client?.number} className="shrink-0 text-base font-bold" />
          </div>
          <p className="mt-1 text-sm text-grayMid">{statusLine}</p>
        </div>
      </div>
      {onNewTask && (
        <Button variant="yellow" size="sm" fullWidth={false} className="shrink-0" onClick={onNewTask}>
          {he.dashboard.newTask}
        </Button>
      )}
    </div>
  );
}
