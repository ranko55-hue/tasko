import { useOrg } from '../lib/orgContext';
import { useDashboard } from '../hooks/useDashboard';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { buildDashboard } from '../lib/dashboardModel';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import KpiRow from '../components/dashboard/KpiRow';
import Kanban from '../components/dashboard/Kanban';

// לוח הבקרה של המנהל — "מגדל הפיקוח". מסך הייחוס לפריסה.
export default function DashboardPage() {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const {
    tasks,
    blockedReasons,
    doneTodayIds,
    loading,
    error,
    connection,
    returnToWork,
    sendManagerUpdate,
    refetch,
  } = useDashboard(member.org_id, member.id);

  const membersMap = Object.fromEntries(members.map((m) => [m.id, m.full_name]));
  const { cols, kpis } = buildDashboard(tasks, doneTodayIds);
  const isEmpty = !loading && !error && tasks.length === 0;
  const live = connection === 'live';

  return (
    <>
      <PageHeader
        title={he.dashboard.title}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-statusGreen' : 'bg-slate-400'}`} />
            {live ? he.dashboard.live : he.dashboard.polling}
          </span>
        }
      />

      {!error && (
        <div className="mb-6">
          <KpiRow kpis={kpis} />
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-lg text-slate-500">{he.dashboard.loading}</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-lg text-slate-600">{he.dashboard.error}</p>
          <button
            type="button"
            onClick={refetch}
            className="min-h-touch rounded-xl bg-brand px-6 font-bold text-white"
          >
            {he.common.retry}
          </button>
        </div>
      ) : isEmpty ? (
        <EmptyState emoji="🗂️" message={he.dashboard.empty} />
      ) : (
        <Kanban
          cols={cols}
          membersMap={membersMap}
          blockedReasons={blockedReasons}
          onReturnToWork={returnToWork}
          onManagerUpdate={sendManagerUpdate}
        />
      )}
    </>
  );
}
