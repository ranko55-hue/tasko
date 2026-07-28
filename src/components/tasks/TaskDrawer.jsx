import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { useTaskTargets } from '../../hooks/useTaskTargets';
import Button from '../shared/Button';
import StatusPill, { STATUS_TONE } from '../ui/StatusPill';
import TaskTimeline from '../media/TaskTimeline';
import TaskDetailsView from './TaskDetailsView';
import TaskEditForm from './TaskEditForm';
import TaskCancelForm from './TaskCancelForm';

const t = he.tasks;

// משימה בודדת: bottom sheet (מובייל) / side panel (דסקטופ). נפתחת מכל מקום.
// המסך הוא מתאם בלבד — התצוגה, העריכה והביטול הם רכיבים נפרדים.
export default function TaskDrawer({ taskId, onClose, isOpen, orgId, isManager = false }) {
  const { task, loading, error, updateTask, cancelTask } = useTaskDetail(taskId);
  const { members } = useOrgMembers(orgId);
  const target = useTaskTargets(orgId);
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'cancel'
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  // סגירה/פתיחה מאפסת מצב, כדי שלא ייפתח על משימה אחרת במצב עריכה
  useEffect(() => {
    setMode('view');
    setShowTimeline(false);
  }, [taskId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const assigneeName =
    members.find((m) => m.id === task?.assignee_id)?.full_name ?? t.unassigned;
  const isCancelled = task?.status === 'cancelled';

  async function save(fields) {
    await updateTask(fields);
    setMode('view');
    setTimelineKey((k) => k + 1); // אירוע 'edited' נכתב בשרת — נטען מחדש
  }

  async function confirmCancel(reason) {
    await cancelTask(reason);
    setMode('view');
    setTimelineKey((k) => k + 1);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === 'edit' ? t.editTitle : task?.title || t.addTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={he.common.cancel}
            className="px-2 text-3xl leading-none text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {error && (
            <p className="py-4 text-center text-red-600">{he.clientDetail.loadError}</p>
          )}
          {loading && (
            <p className="py-4 text-center text-slate-500">{he.common.loading}</p>
          )}

          {task && !loading && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <StatusPill
                  tone={STATUS_TONE[task.status]}
                  label={t.status[task.status] ?? task.status}
                />
                {task.priority === 'urgent' && (
                  <StatusPill tone="red" label={t.priorityOpt.urgent} />
                )}
              </div>

              {mode === 'view' && (
                <TaskDetailsView task={task} assigneeName={assigneeName} />
              )}

              {mode === 'edit' && (
                <TaskEditForm
                  task={task}
                  members={members}
                  target={target}
                  onSave={save}
                  onCancel={() => setMode('view')}
                />
              )}

              {mode === 'cancel' && (
                <TaskCancelForm
                  onConfirm={confirmCancel}
                  onBack={() => setMode('view')}
                />
              )}

              <button
                type="button"
                onClick={() => setShowTimeline((v) => !v)}
                className="mt-6 min-h-touch w-full rounded-lg px-3 text-sm font-bold text-brand hover:bg-brand/5"
              >
                {he.media.openTimeline}
              </button>
              {showTimeline && (
                <div className="mt-4">
                  <TaskTimeline key={timelineKey} taskId={taskId} />
                </div>
              )}

              {isManager && mode === 'view' && !isCancelled && (
                <div className="mt-8 space-y-3">
                  <Button variant="secondary" fullWidth onClick={() => setMode('edit')}>
                    {he.common.edit}
                  </Button>
                  <Button variant="danger" fullWidth onClick={() => setMode('cancel')}>
                    {t.cancelTask}
                  </Button>
                </div>
              )}

              {isCancelled && (
                <p className="mt-8 rounded-lg bg-slate-100 px-3 py-2 text-center font-bold text-slate-600">
                  {t.alreadyCancelled}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
