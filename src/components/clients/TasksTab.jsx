import { useState } from 'react';
import { he } from '../../locales/he';
import Row from '../ui/Row';
import StatusPill, { STATUS_TONE } from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import TabSection from './TabSection';
import Icon from '../ui/Icon';

const CLOSED = ['done', 'cancelled'];
const LOAD_SIZE = 25;

// לשונית משימות — פתוחות / סגורות, lazy loading, חיפוש.
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

  // סינון לפי חיפוש
  const filteredOpen = allOpen.filter((x) =>
    x.title.toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredClosed = allClosed.filter((x) =>
    x.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // lazy loading
  const displayOpen = filteredOpen.slice(0, loadedCount);
  const displayClosed = filteredClosed.slice(0, loadedCount);
  const hasMoreOpen = filteredOpen.length > loadedCount;
  const hasMoreClosed = filteredClosed.length > loadedCount;

  const row = (x) => (
    <Row
      key={x.id}
      icon={<Icon name="task" />}
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

  const showSearch = (filteredOpen.length + filteredClosed.length) > 15;

  return (
    <div className="space-y-4">
      {/* Toggle Open/Closed */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setFilter('open')}
          className={`flex-1 rounded-lg px-3 py-2 font-bold transition-colors ${
            filter === 'open'
              ? 'bg-brand text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {t.closed.replace('{n}', allClosed.length)}
        </button>
      </div>

      {/* Search */}
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

      {/* Open Tasks */}
      {filter === 'open' && (
        <>
          {displayOpen.length === 0 && searchText && (
            <EmptyState icon="search" message={he.shell.searchEmpty} />
          )}
          {displayOpen.length === 0 && !searchText && (
            <EmptyState icon="check" message={t.empty} />
          )}
          <div className="space-y-3">
            {displayOpen.map(row)}
          </div>
          {hasMoreOpen && (
            <button
              type="button"
              onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}
              className="mt-4 min-h-[44px] w-full rounded-lg border-2 border-line px-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              טען עוד…
            </button>
          )}
        </>
      )}

      {/* Closed Tasks */}
      {filter === 'closed' && (
        <>
          {displayClosed.length === 0 && searchText && (
            <EmptyState icon="search" message={he.shell.searchEmpty} />
          )}
          {displayClosed.length === 0 && !searchText && (
            <EmptyState icon="check" message={t.empty} />
          )}
          <div className="space-y-3">
            {displayClosed.map(row)}
          </div>
          {hasMoreClosed && (
            <button
              type="button"
              onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}
              className="mt-4 min-h-[44px] w-full rounded-lg border-2 border-line px-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              טען עוד…
            </button>
          )}
        </>
      )}
    </div>
  );
}
