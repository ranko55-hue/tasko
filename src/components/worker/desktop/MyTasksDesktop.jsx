import { useState } from 'react';
import { he } from '../../../locales/he';
import { useOrg } from '../../../lib/orgContext';
import { isManager } from '../../../lib/roles';
import { useMyTasksView, MY_TASKS_VIEW_OPTIONS } from '../../../hooks/useMyTasksView';
import { startTask, finishTask, finishForApproval, resumeTask, unblockTask } from '../../../lib/taskFlow';
import { useOrgSettings } from '../../../hooks/useOrgSettings';
import ViewToggle from '../../shared/ViewToggle';
import TaskDrawer from '../../tasks/TaskDrawer';
import DeskRowsView from './DeskRowsView';
import DeskCardsView from './DeskCardsView';

// "המשימות שלי" בדסקטופ — שתי תצוגות במתג, בשפת מגדל הפיקוח.
export default function MyTasksDesktop({ tasks, onUpdated }) {
  const { member } = useOrg();
  const { settings } = useOrgSettings(member?.org_id);

  const RUNNERS = {
    start: startTask,
    finish: settings.require_approval ? finishForApproval : finishTask,
    resume: resumeTask,
    unblock: unblockTask,
  };
  const [view, choose] = useMyTasksView();
  const [openTaskId, setOpenTaskId] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const done = tasks.filter((t) => t.status === 'done' || t.status === 'cancelled');

  async function handleAction(task, key) {
    const run = RUNNERS[key];
    if (!run || busy) return;
    setBusy(true);
    try {
      onUpdated(await run(task, member.id));
    } finally {
      setBusy(false);
    }
  }

  const View = view === 'cards' ? DeskCardsView : DeskRowsView;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black text-navy">{he.worker.title}</h1>
        <ViewToggle options={MY_TASKS_VIEW_OPTIONS} view={view} onChange={choose} />
      </div>

      <View
        open={open}
        done={done}
        onOpen={setOpenTaskId}
        onAction={handleAction}
        busy={busy}
      />

      <TaskDrawer
        taskId={openTaskId}
        isOpen={!!openTaskId}
        onClose={() => setOpenTaskId(null)}
        orgId={member.org_id}
        isManager={isManager(member)}
      />
    </>
  );
}
