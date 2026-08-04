import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { useTaskTargets } from '../../hooks/useTaskTargets';
import { useOrg } from '../../lib/orgContext';
import { approveTask, returnTask, transferTask } from '../../lib/taskFlow';
import Button from '../shared/Button';
import DrawerHeader from './drawer/DrawerHeader';
import DrawerViewBody from './drawer/DrawerViewBody';
import TaskEditForm from './TaskEditForm';
import TaskCancelForm from './TaskCancelForm';
import ManagerUpdateModal from './drawer/ManagerUpdateModal';
import ReturnModal from './drawer/ReturnModal';
import TransferModal from './drawer/TransferModal';
import { printTaskSummary } from '../../lib/taskSummary';

const t = he.tasks;

// תפריט "⋯" בפוטר — מקבץ פעולות מנהל נוספות בלי שאף אחת תיעלם.
function FooterOverflow({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.drawer.moreActions}
        className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/25 text-2xl leading-none text-white hover:bg-white/[0.08]"
      >
        ⋯
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute bottom-full end-0 z-20 mb-2 w-52 overflow-hidden rounded-lg border border-line bg-white shadow-xl">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setOpen(false); it.onClick(); }}
                className={`block w-full px-4 py-3 text-start text-sm font-bold hover:bg-appBg ${it.danger ? 'text-danger' : 'text-navy'}`}
              >
                {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// משימה בודדת: bottom sheet (מובייל) / side panel (דסקטופ). נפתחת מכל מקום.
// המסך הוא מתאם בלבד — הכותרת, הגוף, העריכה והביטול הם רכיבים נפרדים.
export default function TaskDrawer({ taskId, onClose, isOpen, orgId, isManager = false, onActionDone }) {
  const { task, loading, error, refetch, updateTask, cancelTask } = useTaskDetail(taskId);
  const { members } = useOrgMembers(orgId);
  const { member } = useOrg();
  const target = useTaskTargets(orgId);
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'cancel'
  const [full, setFull] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setMode('view');
    setFull(false);
    setUpdateOpen(false);
    setReturnOpen(false);
    setTransferOpen(false);
  }, [taskId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const assigneeName = members.find((m) => m.id === task?.assignee_id)?.full_name ?? null;
  const isAssignee = !!(task && member && task.assignee_id === member.id);
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
          assigneeName={assigneeName}
          onClose={onClose}
          onFullScreen={() => setFull((v) => !v)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error && (
            <p className="py-6 text-center text-danger">{he.clientDetail.loadError}</p>
          )}
          {loading && (
            <p className="py-6 text-center text-grayMid">{he.common.loading}</p>
          )}

          {task && !loading && (
            <>
              {mode === 'view' && (
                <DrawerViewBody
                  task={task}
                  assigneeName={assigneeName}
                  refreshKey={refreshKey}
                  onEvents={setEvents}
                  isAssignee={isAssignee}
                  memberId={member.id}
                  orgId={orgId}
                  onRefresh={() => {
                    refetch();
                    setRefreshKey((k) => k + 1);
                  }}
                />
              )}

              {mode === 'edit' && (
                <div className="p-4 sm:p-6">
                  <TaskEditForm
                    task={task}
                    members={members}
                    target={target}
                    orgId={orgId}
                    onSave={save}
                    onCancel={() => setMode('view')}
                  />
                </div>
              )}

              {mode === 'cancel' && (
                <div className="p-4 sm:p-6">
                  <TaskCancelForm
                    onConfirm={confirmCancel}
                    onBack={() => setMode('view')}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* פוטר מנהל קבוע — navy-deep + פס עליון צהוב. פעולות תלויות-מצב (1:1). */}
        {task && !loading && mode === 'view' && (isClosed || isManager) && (
          <div className="shrink-0 border-t-4 border-drYellow bg-drNavyDeep px-4 py-3 sm:px-6">
            {isClosed ? (
              <div className="space-y-2">
                <p className="text-center text-sm text-white/70">{t.drawer.closedTitle}</p>
                <Button variant="secondary" onClick={() => printTaskSummary(task, events, assigneeName)}>
                  {t.drawer.downloadPdf}
                </Button>
              </div>
            ) : task.status === 'pending_approval' ? (
              <div className="flex items-stretch gap-2">
                <Button
                  variant="success"
                  fullWidth={false}
                  className="h-14 flex-1"
                  onClick={async () => {
                    await approveTask(task, member.id);
                    onActionDone?.();
                    onClose();
                  }}
                >
                  {t.drawer.approveClose}
                </Button>
                <FooterOverflow
                  items={[
                    { label: t.drawer.returnBtn, onClick: () => setReturnOpen(true) },
                    { label: t.drawer.transferBtn, onClick: () => setTransferOpen(true) },
                  ]}
                />
              </div>
            ) : (
              <div className="flex items-stretch gap-2">
                <Button fullWidth={false} className="h-14 flex-1" onClick={() => setUpdateOpen(true)}>
                  {t.drawer.managerUpdateTitle}
                </Button>
                <FooterOverflow
                  items={[
                    { label: he.common.edit, onClick: () => setMode('edit') },
                    { label: t.cancelTask, onClick: () => setMode('cancel'), danger: true },
                  ]}
                />
              </div>
            )}
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

        {returnOpen && task && (
          <ReturnModal
            task={task}
            actorId={member.id}
            onClose={() => setReturnOpen(false)}
            onDone={() => {
              setReturnOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}

        {transferOpen && task && (
          <TransferModal
            task={task}
            actorId={member.id}
            members={members}
            onClose={() => setTransferOpen(false)}
            onDone={() => {
              setTransferOpen(false);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </div>
  );
}
