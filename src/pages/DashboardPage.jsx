import { useState, useMemo, useCallback } from 'react';
import { useOrg } from '../lib/orgContext';
import { isManager } from '../lib/roles';
import { useDashboard } from '../hooks/useDashboard';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { buildDashboard, statusCounts, buildActionQueue } from '../lib/dashboardModel';
import { approveTask, acknowledgeOverrun } from '../lib/taskFlow';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import EmptyState from '../components/ui/EmptyState';
import AIGuidanceModule from '../components/dashboard/AIGuidanceModule';
import BoardArea from '../components/dashboard/BoardArea';
import TaskDrawer from '../components/tasks/TaskDrawer';

const t = he.dashboard;

export default function DashboardPage() {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const {
    tasks,
    blockedReasons,
    doneTodayIds,
    loading,
    error,
    connection,
    returnToWork,
    refetch,
  } = useDashboard(member.org_id, member.id);

  const membersMap = useMemo(() => {
    const map = Object.fromEntries(members.map((m) => [m.id, m.full_name]));
    map._phones = Object.fromEntries(
      members.filter((m) => m.phone).map((m) => [m.id, m.phone]),
    );
    return map;
  }, [members]);

  const { cols, kpis } = useMemo(
    () => buildDashboard(tasks, doneTodayIds),
    [tasks, doneTodayIds],
  );

  const counts = useMemo(
    () => statusCounts(tasks, doneTodayIds),
    [tasks, doneTodayIds],
  );

  const actionQueue = useMemo(
    () => buildActionQueue(tasks, blockedReasons),
    [tasks, blockedReasons],
  );

  const handledTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done' && doneTodayIds.has(t.id)),
    [tasks, doneTodayIds],
  );

  const handleAction = useCallback(async (action, task) => {
    if (action === 'approve') {
      await approveTask(task, member.id);
      refetch();
    } else if (action === 'clarify') {
      setSelectedTaskId(task.id);
    } else if (action === 'acknowledge') {
      await acknowledgeOverrun(task, member.id);
      refetch();
    }
  }, [member.id, refetch]);

  const isEmpty = !loading && !error && tasks.length === 0;
  const manager = isManager(member);

  return (
    <>
      {/* Briefing module — real data */}
      {!error && (
        <AIGuidanceModule
          statusCounts={counts}
          actionQueue={actionQueue}
          handledTasks={handledTasks}
          membersMap={membersMap}
          live={connection === 'live'}
          onOpenTask={setSelectedTaskId}
          onAction={handleAction}
        />
      )}

      {/* Counters — real KPIs. יושבים ישר מתחת לתדריך → בלוק "מגדל הפיקוח" מגובש */}
      {!loading && !error && !isEmpty && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CounterCard
            label={t.counters.doneToday}
            value={kpis.doneToday}
            color="text-statusGreen"
          />
          <CounterCard
            label={t.counters.alerts}
            value={kpis.alerts}
            color="text-statusRed"
          />
          <CounterCard
            label={t.counters.inField}
            value={kpis.inField}
            color="text-statusBlue"
          />
          <CounterCard
            label={t.counters.open}
            value={kpis.open}
            color="text-navy"
          />
        </div>
      )}

      {/* Main content */}
      {loading ? (
        <p className="py-8 text-center text-lg text-grayMid">{t.loading}</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-lg text-grayDark">{t.error}</p>
          <Button fullWidth={false} onClick={refetch}>
            {he.common.retry}
          </Button>
        </div>
      ) : isEmpty ? (
        <EmptyState icon="project" message={t.empty} />
      ) : (
        <BoardArea
          cols={cols}
          tasks={tasks}
          membersMap={membersMap}
          blockedReasons={blockedReasons}
          onOpenTask={setSelectedTaskId}
          onReturnToWork={returnToWork}
          currentMemberId={member.id}
          onRefresh={refetch}
        />
      )}

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        orgId={member.org_id}
        isManager={manager}
        onActionDone={refetch}
      />
    </>
  );
}

function CounterCard({ label, value, color }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3 text-center">
      <div className={`text-2xl font-black ${color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div className="mt-1 text-xs font-bold text-grayMid">{label}</div>
    </div>
  );
}
