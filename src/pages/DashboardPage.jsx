import { useOrg } from '../lib/orgContext';
import { useDashboard } from '../hooks/useDashboard';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { buildDashboard } from '../lib/dashboardModel';
import { he } from '../locales/he';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import KpiRow from '../components/dashboard/KpiRow';
import Kanban from '../components/dashboard/Kanban';

// לוח הבקרה של המנהל — "מגדל הפיקוח"
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

  return (
    <div className="min-h-full bg-slate-100">
      <div className="bg-navy">
        <DashboardHeader connection={connection} />
        {!error && (
          <div className="px-4 pb-4">
            <KpiRow kpis={kpis} />
          </div>
        )}
      </div>

      <main className="p-4">
        {loading ? (
          <p className="py-16 text-center text-lg text-slate-500">
            {he.dashboard.loading}
          </p>
        ) : error ? (
          <div className="py-16 text-center">
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
          <p className="py-16 text-center text-lg text-slate-500">
            {he.dashboard.empty}
          </p>
        ) : (
          <Kanban
            cols={cols}
            membersMap={membersMap}
            blockedReasons={blockedReasons}
            onReturnToWork={returnToWork}
            onManagerUpdate={sendManagerUpdate}
          />
        )}
      </main>
    </div>
  );
}
