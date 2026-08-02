import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import StatusPill from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';

const CLOSED = ['done', 'cancelled'];
const LOAD_SIZE = 25;

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function TaskRow({ task, assigneeName, onOpen }) {
  const urgent = task.priority === 'urgent';
  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-right transition-colors hover:bg-surface"
    >
      <span className="shrink-0 text-grayLight">
        <Icon name="task" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-bold text-navy">{task.title}</span>
          {urgent && (
            <span className="shrink-0 rounded bg-dangerLight px-2 py-1 text-xs font-bold text-urgentInk">
              {he.tasks.priorityOpt.urgent}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-grayMid">
          <span>{assigneeName}</span>
          {task.project?.name && <span>{task.project.name}</span>}
          {fmtDate(task.ends_on) && <span>{he.tasks.due}: {fmtDate(task.ends_on)}</span>}
        </div>
      </div>
      <div className="shrink-0">
        <StatusPill status={task.status} />
      </div>
    </button>
  );
}

export default function TasksTab({ tasks, members, onOpenTask, onNewTask }) {
  const t = he.clientDetail.tasksTab;
  const [filter, setFilter] = useState('open');
  const [searchText, setSearchText] = useState('');
  const [loadedCount, setLoadedCount] = useState(LOAD_SIZE);

  if (!tasks.length) return <EmptyState icon="task" message={t.empty} />;

  const nameOf = (id) =>
    members.find((m) => m.id === id)?.full_name ?? he.tasks.unassigned;

  const allOpen = tasks.filter((x) => !CLOSED.includes(x.status));
  const allClosed = tasks.filter((x) => CLOSED.includes(x.status));

  const filteredOpen = allOpen.filter((x) =>
    x.title.toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredClosed = allClosed.filter((x) =>
    x.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const displayOpen = filteredOpen.slice(0, loadedCount);
  const displayClosed = filteredClosed.slice(0, loadedCount);
  const hasMoreOpen = filteredOpen.length > loadedCount;
  const hasMoreClosed = filteredClosed.length > loadedCount;

  const renderRow = (x) => (
    <TaskRow
      key={x.id}
      task={x}
      assigneeName={nameOf(x.assignee_id)}
      onOpen={onOpenTask}
    />
  );

  const showSearch = (filteredOpen.length + filteredClosed.length) > 15;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setFilter('open')}
          className={`flex-1 rounded-lg px-3 py-2 font-bold transition-colors ${
            filter === 'open'
              ? 'bg-brand text-white'
              : 'bg-appBg text-inkSoft hover:bg-line'
          }`}
        >
          {t.open.replace('{n}', allOpen.length)}
        </button>
        <button
          type="button"
          onClick={() => setFilter('closed')}
          className={`flex-1 rounded-lg px-3 py-2 font-bold transition-colors ${
            filter === 'closed'
              ? 'bg-brand text-white'
              : 'bg-appBg text-inkSoft hover:bg-line'
          }`}
        >
          {t.closed.replace('{n}', allClosed.length)}
        </button>
      </div>

      {showSearch && (
        <input
          type="text"
          placeholder="חיפוש משימות…"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setLoadedCount(LOAD_SIZE);
          }}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm"
        />
      )}

      {filter === 'open' && (
        <>
          {displayOpen.length === 0 && searchText && (
            <EmptyState icon="search" message={he.shell.searchEmpty} />
          )}
          {displayOpen.length === 0 && !searchText && (
            <EmptyState icon="check" message={t.empty} />
          )}
          <div className="space-y-2">{displayOpen.map(renderRow)}</div>
          {hasMoreOpen && (
            <Button variant="secondary" className="mt-4" onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}>
              טען עוד…
            </Button>
          )}
        </>
      )}

      {filter === 'closed' && (
        <>
          {displayClosed.length === 0 && searchText && (
            <EmptyState icon="search" message={he.shell.searchEmpty} />
          )}
          {displayClosed.length === 0 && !searchText && (
            <EmptyState icon="check" message={t.empty} />
          )}
          <div className="space-y-2">{displayClosed.map(renderRow)}</div>
          {hasMoreClosed && (
            <Button variant="secondary" className="mt-4" onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}>
              טען עוד…
            </Button>
          )}
        </>
      )}
    </div>
  );
}
