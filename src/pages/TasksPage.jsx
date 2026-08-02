import { useState, useMemo } from 'react';
import { useOrg } from '../lib/orgContext';
import { useAllTasks } from '../hooks/useAllTasks';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { he } from '../locales/he';
import { isManager } from '../lib/roles';
import { dateRangeLabel } from '../lib/taskDates';
import StatusPill from '../components/ui/StatusPill';
import RefNumber from '../components/shared/RefNumber';
import PageHeader from '../components/ui/PageHeader';
import TaskDrawer from '../components/tasks/TaskDrawer';

const t = he.tasks;
const NUM = { fontVariantNumeric: 'tabular-nums' };

const STATUSES = [
  'pending', 'in_progress', 'paused', 'blocked',
  'pending_approval', 'done', 'cancelled',
];

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-touch rounded-lg px-3 text-sm font-bold transition-colors ${
        active ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );
}

export default function TasksPage() {
  const { member } = useOrg();
  const { tasks, loading, refetch } = useAllTasks(member.org_id);
  const { members } = useOrgMembers(member.org_id);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [openTaskId, setOpenTaskId] = useState(null);

  const membersMap = useMemo(
    () => Object.fromEntries((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );

  const filtered = useMemo(() => {
    let list = tasks;

    if (statusFilter !== 'all') list = list.filter((x) => x.status === statusFilter);
    if (assigneeFilter !== 'all') list = list.filter((x) => x.assignee_id === assigneeFilter);
    if (priorityFilter !== 'all') list = list.filter((x) => x.priority === priorityFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.title?.toLowerCase().includes(q) ||
          x.client?.name?.toLowerCase().includes(q) ||
          x.project?.name?.toLowerCase().includes(q) ||
          String(x.id).includes(q),
      );
    }

    return list;
  }, [tasks, statusFilter, assigneeFilter, priorityFilter, search]);

  const activeWorkers = useMemo(
    () => (members ?? []).filter((m) => m.is_active),
    [members],
  );

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* שורת פילטרים */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {/* סטטוס */}
        <div className="flex flex-wrap gap-1">
          <FilterChip label={t.filterAll} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          {STATUSES.map((s) => (
            <FilterChip key={s} label={t.status[s]} active={statusFilter === s} onClick={() => setStatusFilter(s)} />
          ))}
        </div>

        {/* עובד */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-slate-900"
        >
          <option value="all">{t.filterAssignee}: {t.filterAll}</option>
          {activeWorkers.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name}</option>
          ))}
        </select>

        {/* עדיפות */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-slate-900"
        >
          <option value="all">{t.filterPriority}: {t.filterAll}</option>
          <option value="normal">{t.priorityOpt.normal}</option>
          <option value="urgent">{t.priorityOpt.urgent}</option>
        </select>

        {/* חיפוש חופשי */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={he.shell.search}
          className="min-h-touch w-full rounded-xl border border-line bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 sm:w-56"
        />
      </div>

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-lg text-slate-400">
          {search || statusFilter !== 'all' || assigneeFilter !== 'all'
            ? he.shell.searchEmpty
            : t.emptyAll}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-slate-50 text-right text-xs font-bold text-slate-500">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{t.fieldTitle}</th>
                <th className="hidden px-3 py-2 sm:table-cell">{t.client}</th>
                <th className="hidden px-3 py-2 md:table-cell">{t.assignee}</th>
                <th className="px-3 py-2">{t.filterStatus}</th>
                <th className="hidden px-3 py-2 md:table-cell">{t.startsOn}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => setOpenTaskId(task.id)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
                >
                  <td className="px-3 py-2" style={NUM}>
                    <RefNumber value={task.id} />
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-bold text-slate-900">
                    {task.title}
                  </td>
                  <td className="hidden max-w-[8rem] truncate px-3 py-2 text-slate-600 sm:table-cell">
                    {task.client?.name ?? he.common.none}
                  </td>
                  <td className="hidden max-w-[8rem] truncate px-3 py-2 text-slate-600 md:table-cell">
                    {task.assignee?.full_name ?? t.unassigned}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={task.status} />
                  </td>
                  <td className="hidden px-3 py-2 text-slate-500 md:table-cell" style={NUM}>
                    {dateRangeLabel(task) ?? he.common.none}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDrawer
        taskId={openTaskId}
        isOpen={!!openTaskId}
        orgId={member.org_id}
        isManager={isManager(member)}
        onClose={() => setOpenTaskId(null)}
        onUpdated={refetch}
      />
    </>
  );
}
