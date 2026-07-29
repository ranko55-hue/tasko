import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { isManager } from '../lib/roles';
import { useDashboard } from '../hooks/useDashboard';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useAlerts } from '../hooks/useAlerts';
import { buildDashboard } from '../lib/dashboardModel';
import { he } from '../locales/he';
import { supabase } from '../lib/supabase';
import { readStringArray, writeJSON } from '../lib/storage';
import { withSignedUrls } from '../lib/media';
import EmptyState from '../components/ui/EmptyState';
import AIGuidanceModule from '../components/dashboard/AIGuidanceModule';
import DashboardTaskCard from '../components/dashboard/DashboardTaskCard';
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
  const [taskEventsMap, setTaskEventsMap] = useState({});
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

  // Fetch task events on demand (when card expands)
  const fetchTaskEvents = useCallback(async (taskId) => {
    if (taskEventsMap[taskId]) return; // Already loaded
    try {
      const { data, error } = await supabase
        .from('task_events')
        .select('id, type, payload, created_at, actor_id, actor:org_members(full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // כתובות חתומות כדי שתמונות והקלטות יוצגו גם בכרטיס, לא רק בציר המלא
      const enriched = await withSignedUrls(data);
      setTaskEventsMap((prev) => ({ ...prev, [taskId]: enriched }));
    } catch (err) {
      console.error('DashboardPage[taskEvents]', err.code ?? '', err.message ?? err);
    }
  }, [taskEventsMap]);

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
        <button
          type="button"
          onClick={() => setNewTaskOpen(true)}
          className="min-h-touch rounded-lg bg-brandYellow px-4 py-2.5 font-bold text-navy hover:bg-brandYellow/90"
        >
          {he.dashboard.newTask}
        </button>
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
          <button
            type="button"
            onClick={refetch}
            className="min-h-touch rounded-xl bg-brand px-6 font-bold text-white"
          >
            {he.common.retry}
          </button>
        </div>
      ) : isEmpty ? (
        <EmptyState icon="project" message={he.dashboard.empty} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          {/* Column: Waiting */}
          <div>
            <h2 className="mb-3 font-bold text-slate-900">{he.dashboard.columns.waiting} ({cols.waiting.length})</h2>
            <div className="space-y-3">
              {cols.waiting.map((t) => (
                <DashboardTaskCard
                  key={t.id}
                  task={t}
                  assigneeName={membersMap[t.assignee_id]}
                  blockedReason={blockedReasons[t.id]}
                  onOpenTask={setSelectedTaskId}
                  onReturnToWork={returnToWork}
                  taskEvents={taskEventsMap[t.id] || []}
                  onExpandDetails={() => fetchTaskEvents(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Column: Working */}
          <div>
            <h2 className="mb-3 font-bold text-slate-900">{he.dashboard.columns.working} ({cols.working.length})</h2>
            <div className="space-y-3">
              {cols.working.map((t) => (
                <DashboardTaskCard
                  key={t.id}
                  task={t}
                  assigneeName={membersMap[t.assignee_id]}
                  blockedReason={blockedReasons[t.id]}
                  onOpenTask={setSelectedTaskId}
                  onReturnToWork={returnToWork}
                  taskEvents={taskEventsMap[t.id] || []}
                  onExpandDetails={() => fetchTaskEvents(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Column: Alert */}
          <div>
            <h2 className="mb-3 font-bold text-statusRed">{he.dashboard.columns.alert} ({cols.alert.length})</h2>
            <div className="space-y-3">
              {cols.alert.map((t) => (
                <DashboardTaskCard
                  key={t.id}
                  task={t}
                  assigneeName={membersMap[t.assignee_id]}
                  blockedReason={blockedReasons[t.id]}
                  onOpenTask={setSelectedTaskId}
                  onReturnToWork={returnToWork}
                  taskEvents={taskEventsMap[t.id] || []}
                  onExpandDetails={() => fetchTaskEvents(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Column: Done */}
          <div>
            <h2 className="mb-3 font-bold text-slate-900">{he.dashboard.columns.doneToday} ({cols.done.length})</h2>
            <div className="space-y-3">
              {cols.done.map((t) => (
                <DashboardTaskCard
                  key={t.id}
                  task={t}
                  assigneeName={membersMap[t.assignee_id]}
                  blockedReason={blockedReasons[t.id]}
                  onOpenTask={setSelectedTaskId}
                  onReturnToWork={returnToWork}
                  taskEvents={taskEventsMap[t.id] || []}
                  onExpandDetails={() => fetchTaskEvents(t.id)}
                />
              ))}
            </div>
          </div>
        </div>
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
