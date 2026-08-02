import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { isManager } from '../lib/roles';
import { useDashboard } from '../hooks/useDashboard';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useAlerts } from '../hooks/useAlerts';
import { buildDashboard } from '../lib/dashboardModel';
import { he } from '../locales/he';
import { readStringArray, writeJSON } from '../lib/storage';
import Button from '../components/shared/Button';
import EmptyState from '../components/ui/EmptyState';
import AIGuidanceModule from '../components/dashboard/AIGuidanceModule';
import BoardArea from '../components/dashboard/BoardArea';
import TaskDrawer from '../components/tasks/TaskDrawer';
import NewTaskModal from '../components/shell/NewTaskModal';

const PINNED_CHIPS_KEY = 'dashboard.pinnedChips';

// לוח הבקרה של המנהל — "מגדל הפיקוח" — עיצוב 2026.
// TaskDrawer נפתח כשלוחצים על כרטיס משימה.
export default function DashboardPage() {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [pinnedChips, setPinnedChips] = useState([]);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

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

  const {
    alerts,
    serviceRequests,
    blockedTasks,
    overrunTasks,
  } = useAlerts(member.org_id);

  const membersMap = Object.fromEntries(members.map((m) => [m.id, m.full_name]));
  const { cols } = buildDashboard(tasks, doneTodayIds);
  const isEmpty = !loading && !error && tasks.length === 0;
  const manager = isManager(member);

  // צ'יפים מוצמדים — נשמרים כמערך מחרוזות ונקראים תמיד עם ‎.includes()
  useEffect(() => {
    setPinnedChips(readStringArray(PINNED_CHIPS_KEY));
  }, []);

  function handleTogglePinned(chips) {
    const safe = Array.isArray(chips) ? chips : [];
    setPinnedChips(safe);
    writeJSON(PINNED_CHIPS_KEY, safe);
  }


  // Calculate pinned chip counts from tasks
  const pinnedTaskCounts = {
    in_field: cols.working.length,
    in_delay: cols.alert.length,
    not_started: cols.waiting.filter((t) => !t.work_started_at).length,
    scheduled: tasks.filter((t) => t.status === 'scheduled').length,
    completed_today: cols.done.length,
  };

  return (
    <>
      {/* AI Guidance Module — החלף KPI row */}
      {!error && (
        <AIGuidanceModule
          alerts={alerts}
          serviceRequests={serviceRequests}
          blockedTasks={blockedTasks}
          overrunTasks={overrunTasks}
          unclosedTasks={tasks.filter((t) => !['done', 'cancelled'].includes(t.status) && t.due_at && new Date(t.due_at) < new Date())}
          pinnedChips={pinnedChips}
          onTogglePinned={handleTogglePinned}
          pinnedTaskCounts={pinnedTaskCounts}
          live={connection === 'live'}
        />
      )}

      {/* פס פעולות — הכפתורים היו ללא onClick ולכן לא הגיבו כלל */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button variant="yellow" fullWidth={false} onClick={() => setNewTaskOpen(true)}>
          {he.dashboard.newTask}
        </Button>
        <Link
          to="/my"
          className="flex min-h-touch items-center rounded-lg border-2 border-line px-4 font-bold text-slate-700 hover:bg-slate-50"
        >
          {he.nav.myTasks}
        </Link>
      </div>

      {/* Main content */}
      {loading ? (
        <p className="py-8 text-center text-lg text-slate-500">{he.dashboard.loading}</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-lg text-slate-600">{he.dashboard.error}</p>
          <Button fullWidth={false} onClick={refetch}>
            {he.common.retry}
          </Button>
        </div>
      ) : isEmpty ? (
        <EmptyState icon="project" message={he.dashboard.empty} />
      ) : (
        <BoardArea
          cols={cols}
          tasks={tasks}
          membersMap={membersMap}
          blockedReasons={blockedReasons}
          onOpenTask={setSelectedTaskId}
          onReturnToWork={returnToWork}
          currentMemberId={member.id}
        />
      )}

      {newTaskOpen && (
        <NewTaskModal
          onClose={() => setNewTaskOpen(false)}
          onDone={() => {
            setNewTaskOpen(false);
            refetch();
          }}
        />
      )}

      {/* TaskDrawer */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        orgId={member.org_id}
        isManager={manager}
      />
    </>
  );
}
