import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { useTaskDetail } from '../../hooks/useTaskDetail';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { formatDateTime } from '../../lib/time';
import Button from '../shared/Button';
import Field from '../ui/Field';
import StatusPill, { STATUS_TONE } from '../ui/StatusPill';
import TaskTimeline from '../media/TaskTimeline';

// משימה בודדת בתור bottom sheet (מובייל) או side panel (דסקטופ)
// נפתחת מכל מקום: כרטיס, שורה, קישור ישיר /tasks/:id
export default function TaskDrawer({
  taskId,
  onClose,
  isOpen,
  orgId,
  isManager = false,
}) {
  const { task, loading, error } = useTaskDetail(taskId);
  const { members } = useOrgMembers(orgId);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [showTimeline, setShowTimeline] = useState(false);

  const t = he.tasks;
  const d = he.dashboard;

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        address: task.address || '',
        assignee_id: task.assignee_id || '',
        status: task.status || 'pending',
      });
    }
  }, [task]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') onClose();
  }

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const assigneeName =
    members.find((m) => m.id === (task?.assignee_id || formData.assignee_id))
      ?.full_name || t.unassigned;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {task?.title || t.addTitle}
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

        {/* Content */}
        <div className="p-4 sm:p-6">
          {error && (
            <p className="py-4 text-center text-red-600">{he.clientDetail.loadError}</p>
          )}

          {loading && <p className="py-4 text-center text-slate-500">{he.common.loading}</p>}

          {task && !loading && (
            <>
              {/* Status & Priority */}
              <div className="mb-6 flex items-center gap-3">
                {task.status && (
                  <StatusPill
                    tone={STATUS_TONE[task.status]}
                    label={t.status[task.status] || task.status}
                  />
                )}
                {task.priority === 'urgent' && (
                  <StatusPill tone="red" label={t.priorityOpt.urgent} />
                )}
              </div>

              {/* Task Details */}
              {!editMode ? (
                <div className="space-y-4">
                  {task.project && (
                    <div>
                      <div className="text-sm text-slate-500">פרויקט</div>
                      <div className="font-bold text-slate-900">
                        {task.project.clients?.name
                          ? `${task.project.clients.name} · ${task.project.name}`
                          : task.project.name}
                      </div>
                    </div>
                  )}

                  {task.description && (
                    <div>
                      <div className="text-sm text-slate-500">{t.description}</div>
                      <div className="text-slate-900">{task.description}</div>
                    </div>
                  )}

                  {task.address && (
                    <div>
                      <div className="text-sm text-slate-500">{t.address}</div>
                      <div className="text-slate-900">{task.address}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-slate-500">{t.assignee}</div>
                    <div className="text-slate-900">{assigneeName}</div>
                  </div>

                  {task.due_at && (
                    <div>
                      <div className="text-sm text-slate-500">{t.dueAt}</div>
                      <div className="text-slate-900">{formatDateTime(task.due_at)}</div>
                    </div>
                  )}

                  {task.requirements?.length > 0 && (
                    <div>
                      <div className="text-sm text-slate-500">
                        {t.requirements.replace('{n}', task.requirements.length)}
                      </div>
                      <div className="space-y-1">
                        {task.requirements.map((req, i) => (
                          <div key={i} className="rounded bg-slate-50 p-2 text-sm text-slate-700">
                            • {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-4">
                  <Field
                    label={t.fieldTitle}
                    value={formData.title}
                    onChange={(v) => setFormData({ ...formData, title: v })}
                  />
                  <Field
                    label={t.description}
                    value={formData.description}
                    onChange={(v) => setFormData({ ...formData, description: v })}
                    as="textarea"
                  />
                  <Field
                    label={t.assignee}
                    value={formData.assignee_id}
                    onChange={(v) => setFormData({ ...formData, assignee_id: v })}
                    as="select"
                    options={[
                      { value: '', label: t.unassigned },
                      ...members.map((m) => ({ value: m.id, label: m.full_name })),
                    ]}
                  />
                </div>
              )}

              {/* Timeline */}
              <button
                type="button"
                onClick={() => setShowTimeline((v) => !v)}
                className="mt-6 min-h-[44px] w-full rounded-lg px-3 text-sm font-bold text-brand hover:bg-brand/5"
              >
                {he.media.openTimeline}
              </button>
              {showTimeline && (
                <div className="mt-4">
                  <TaskTimeline taskId={taskId} />
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 space-y-3">
                {isManager && !editMode && (
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setEditMode(true)}
                  >
                    ✏️ {he.common.edit || 'ערוך'}
                  </Button>
                )}

                {isManager && editMode && (
                  <>
                    <Button fullWidth onClick={() => setEditMode(false)}>
                      {he.common.save}
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => setEditMode(false)}
                    >
                      {he.common.cancel}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
