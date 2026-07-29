import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { useTaskTargets } from '../../hooks/useTaskTargets';
import DrawerHeader from './drawer/DrawerHeader';
import DrawerViewBody from './drawer/DrawerViewBody';
import TaskEditForm from './TaskEditForm';
import TaskCancelForm from './TaskCancelForm';
import ManagerUpdateModal from './drawer/ManagerUpdateModal';
import { printTaskSummary } from '../../lib/taskSummary';

const t = he.tasks;

// משימה בודדת: bottom sheet (מובייל) / side panel (דסקטופ). נפתחת מכל מקום.
// המסך הוא מתאם בלבד — הכותרת, הגוף, העריכה והביטול הם רכיבים נפרדים.
export default function TaskDrawer({ taskId, onClose, isOpen, orgId, isManager = false }) {
  const { task, loading, error, updateTask, cancelTask } = useTaskDetail(taskId);
  const { members } = useOrgMembers(orgId);
  const target = useTaskTargets(orgId);
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'cancel'
  const [full, setFull] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [events, setEvents] = useState([]);

  // פתיחה על משימה אחרת מאפסת מצב
  useEffect(() => {
    setMode('view');
    setFull(false);
    setUpdateOpen(false);
  }, [taskId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const assigneeName = members.find((m) => m.id === task?.assignee_id)?.full_name ?? null;
  // משימה סגורה = תיעוד בלבד: אין עריכה, אין ביטול, יש סיכום
  const isClosed = ['done', 'cancelled'].includes(task?.status);

  async function save(fields) {
    await updateTask(fields);
    setMode('view');
    setRefreshKey((k) => k + 1); // אירוע 'edited' נכתב בשרת — נטען מחדש
  }

  async function confirmCancel(reason) {
    await cancelTask(reason);
    setMode('view');
    setRefreshKey((k) => k + 1);
  }

  const panel = full
    ? 'h-full w-full rounded-none'
    : 'max-h-[92vh] w-full rounded-t-2xl sm:max-w-lg sm:rounded-2xl';

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className={`flex flex-col overflow-hidden bg-white shadow-xl ${panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader
          task={task}
          onClose={onClose}
          onFullScreen={() => setFull((v) => !v)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && (
            <p className="py-6 text-center text-red-600">{he.clientDetail.loadError}</p>
          )}
          {loading && (
            <p className="py-6 text-center text-slate-500">{he.common.loading}</p>
          )}

          {task && !loading && (
            <>
              {mode === 'view' && (
                <DrawerViewBody
                  task={task}
                  assigneeName={assigneeName}
                  refreshKey={refreshKey}
                  onEvents={setEvents}
                />
              )}

              {mode === 'edit' && (
                <div className="p-4 sm:p-5">
                  <TaskEditForm
                    task={task}
                    members={members}
                    target={target}
                    onSave={save}
                    onCancel={() => setMode('view')}
                  />
                </div>
              )}

              {mode === 'cancel' && (
                <div className="p-4 sm:p-5">
                  <TaskCancelForm
                    onConfirm={confirmCancel}
                    onBack={() => setMode('view')}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* שורת פעולות תחתונה — נשארת מוצמדת מתחת לתוכן הנגלל */}
        {task && !loading && mode === 'view' && (
          <div className="shrink-0 border-t border-line bg-surfaceBar px-4 py-3 sm:px-5">
            {isClosed ? (
              <div className="space-y-2">
                <p className="text-center text-sm text-slate-500">{t.drawer.closedTitle}</p>
                <button
                  type="button"
                  onClick={() => printTaskSummary(task, events, assigneeName)}
                  className="min-h-touch w-full rounded-xl border-2 border-line bg-white px-4 font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.drawer.downloadPdf}
                </button>
              </div>
            ) : isManager ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateOpen(true)}
                  className="min-h-touch flex-1 rounded-xl bg-brand px-4 font-bold text-white hover:bg-brand-dark"
                >
                  {t.drawer.managerUpdateTitle}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="min-h-touch rounded-xl border-2 border-line px-5 font-bold text-slate-700 hover:bg-white"
                >
                  {he.common.edit}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('cancel')}
                  className="min-h-touch rounded-xl border-2 border-red-300 px-4 font-bold text-red-600 hover:bg-red-50"
                >
                  {t.cancelTask}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {updateOpen && task && (
          <ManagerUpdateModal
            task={task}
            onClose={() => setUpdateOpen(false)}
            onSent={() => {
              setUpdateOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
