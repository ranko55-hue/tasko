import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ProjectForm from '../projects/ProjectForm';
import StatusPill from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import Icon from '../ui/Icon';

const LOAD_SIZE = 25;

// לשונית פרויקטים — פתוחים / סגורים, lazy loading, חיפוש. ללא TabSection (מחליפים עם toggle).
export default function ProjectsTab({
  projects,
  openTaskCountByProject,
  onAddProject,
  onOpenProject,
  members = [],
}) {
  const p = he.clientDetail.projectsTab;
  const [formOpen, setFormOpen] = useState(false);
  const [filter, setFilter] = useState('open');
  const [searchText, setSearchText] = useState('');
  const [loadedCount, setLoadedCount] = useState(LOAD_SIZE);

  const allOpen = projects.filter((x) => x.status === 'open');
  const allClosed = projects.filter((x) => x.status !== 'open');

  // סינון לפי חיפוש
  const filteredOpen = allOpen.filter((x) =>
    x.name.toLowerCase().includes(searchText.toLowerCase())
  );
  const filteredClosed = allClosed.filter((x) =>
    x.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // lazy loading
  const displayOpen = filteredOpen.slice(0, loadedCount);
  const displayClosed = filteredClosed.slice(0, loadedCount);
  const hasMoreOpen = filteredOpen.length > loadedCount;
  const hasMoreClosed = filteredClosed.length > loadedCount;

  async function submit(fields) {
    await onAddProject(fields);
    setFormOpen(false);
  }

  const row = (x) => {
    const openCount = openTaskCountByProject[x.id] || 0;
    return (
      <button
        key={x.id}
        type="button"
        onClick={() => onOpenProject(x)}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-right transition-colors hover:bg-slate-50"
      >
        <span className="shrink-0 text-slate-400">
          <Icon name="project" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold text-slate-900">{x.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            {x.address && <span>{x.address}</span>}
            {x.status === 'open' && openCount > 0 && (
              <span>{openCount} {he.dashboard.kpi.open}</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          {x.status === 'open' ? (
            <StatusPill
              tone="green"
              label={p.activeTag.replace('{n}', openCount)}
            />
          ) : (
            <StatusPill tone="done" label={he.projects.status.closed} />
          )}
        </div>
      </button>
    );
  };

  const showSearch = (filteredOpen.length + filteredClosed.length) > 15;

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="max-w-xs">
        <Button onClick={() => setFormOpen(true)}>{p.add}</Button>
      </div>

      {!projects.length ? (
        <EmptyState icon="project" message={p.empty} />
      ) : (
        <>
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
              {p.open.replace('{n}', allOpen.length)}
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
              {p.closed.replace('{n}', allClosed.length)}
            </button>
          </div>

          {/* Search */}
          {showSearch && (
            <input
              type="text"
              placeholder="חיפוש פרויקטים…"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setLoadedCount(LOAD_SIZE);
              }}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          )}

          {/* Open Projects */}
          {filter === 'open' && (
            <>
              {displayOpen.length === 0 && searchText && (
                <EmptyState icon="search" message={he.shell.searchEmpty} />
              )}
              {displayOpen.length === 0 && !searchText && (
                <EmptyState icon="check" message={p.empty} />
              )}
              <div className="space-y-3">
                {displayOpen.map(row)}
              </div>
              {hasMoreOpen && (
                <Button variant="secondary" className="mt-4" onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}>
                  טען עוד…
                </Button>
              )}
            </>
          )}

          {/* Closed Projects */}
          {filter === 'closed' && (
            <>
              {displayClosed.length === 0 && searchText && (
                <EmptyState icon="search" message={he.shell.searchEmpty} />
              )}
              {displayClosed.length === 0 && !searchText && (
                <EmptyState icon="check" message={p.empty} />
              )}
              <div className="space-y-3">
                {displayClosed.map(row)}
              </div>
              {hasMoreClosed && (
                <Button variant="secondary" className="mt-4" onClick={() => setLoadedCount((c) => c + LOAD_SIZE)}>
                  טען עוד…
                </Button>
              )}
            </>
          )}
        </>
      )}

      {formOpen && (
        <Modal title={he.projects.addTitle} onClose={() => setFormOpen(false)}>
          <ProjectForm members={members} onSubmit={submit} onCancel={() => setFormOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
