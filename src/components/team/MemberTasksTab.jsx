import { useState, useMemo } from 'react';
import { he } from '../../locales/he';
import TaskDrawer from '../tasks/TaskDrawer';

const t = he.team.detail;
const NUM = { fontVariantNumeric: 'tabular-nums' };

const STATUS_COLORS = {
  pending: 'bg-slate-400',
  scheduled: 'bg-blue-400',
  in_progress: 'bg-statusGreen',
  paused: 'bg-yellow-400',
  blocked: 'bg-red-400',
  done: 'bg-slate-400/60',
  cancelled: 'bg-slate-300',
};

const FILTERS = [
  { key: 'all', label: t.tasksFilterAll },
  { key: 'open', label: t.tasksFilterOpen },
  { key: 'done', label: t.tasksFilterDone },
  { key: 'cancelled', label: t.tasksFilterCancelled },
];

const OPEN = ['pending', 'scheduled', 'in_progress', 'paused', 'blocked'];

export default function MemberTasksTab({ tasks, loading, orgId, isManager }) {
  const [filter, setFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'open') list = list.filter((t) => OPEN.includes(t.status));
    else if (filter === 'done') list = list.filter((t) => t.status === 'done');
    else if (filter === 'cancelled') list = list.filter((t) => t.status === 'cancelled');

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => t.title?.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, filter, search]);

  if (loading) return <p className="py-8 text-center text-slate-500">{he.common.loading}</p>;

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`min-h-touch rounded-lg px-3 text-xs font-bold ${
                filter === f.key ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={he.shell.searchPlaceholder}
          className="min-h-touch w-full rounded-xl border border-line bg-white px-3 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none sm:w-56"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{t.tasksEmpty}</p>
      ) : (
        <div className="divide-y divide-line">
          {filtered.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => setSelectedTaskId(task.id)}
              className="flex min-h-touch w-full items-center gap-3 px-1 py-3 text-start hover:bg-slate-50"
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_COLORS[task.status] || 'bg-slate-400'}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{task.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {[task.client?.name, task.project?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {he.tasks.status[task.status] ?? task.status}
              </span>
              <span className="w-14 shrink-0 text-end text-xs text-slate-400" style={NUM}>
                #{task.id}
              </span>
            </button>
          ))}
        </div>
      )}

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        orgId={orgId}
        isManager={isManager}
      />
    </div>
  );
}
