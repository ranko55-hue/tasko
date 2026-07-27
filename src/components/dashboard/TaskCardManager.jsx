import { useState } from 'react';
import { he } from '../../locales/he';
import { STATUS_DOT } from '../../lib/taskMeta';
import { isOverrun } from '../../lib/dashboardModel';
import { formatDateTime } from '../../lib/time';
import LiveNet from './LiveNet';
import TextEntryModal from '../worker/TextEntryModal';
import TaskTimeline from '../media/TaskTimeline';
import StatusPill from '../ui/StatusPill';

const d = he.dashboard;

// כרטיס משימה בלוח המנהל
export default function TaskCardManager({
  task,
  assigneeName,
  blockedReason,
  onReturnToWork,
  onManagerUpdate,
}) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const overrun = isOverrun(task);
  const active = ['in_progress', 'paused'].includes(task.status);

  async function submitUpdate(text) {
    await onManagerUpdate(task, text);
    setShowUpdate(false);
  }

  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[task.status] ?? 'bg-slate-400'} ${task.status === 'in_progress' ? 'animate-pulse' : ''}`}
          />
          <div className="font-bold leading-tight text-slate-900">
            {task.title}
          </div>
        </div>
        {task.priority === 'urgent' && (
          <div className="shrink-0">
            <StatusPill tone="red" label={he.tasks.priorityOpt.urgent} />
          </div>
        )}
      </div>

      <div className="mt-2 space-y-0.5 text-sm text-slate-500">
        {task.project && (
          <div>
            {task.project.client?.name
              ? `${task.project.client.name} · ${task.project.name}`
              : task.project.name}
          </div>
        )}
        <div>{assigneeName || d.noAssignee}</div>
        <div>{formatDateTime(task.due_at) ?? d.noDue}</div>
      </div>

      {active && (
        <div className="mt-2 flex items-center gap-2">
          {task.status === 'paused' && (
            <span className="text-sm font-bold text-yellow-600">⏸ {d.pausedMark}</span>
          )}
          <LiveNet
            task={task}
            className={overrun ? 'text-statusRed' : 'text-slate-800'}
          />
          {overrun && (
            <span className="animate-blink rounded-full bg-statusRed px-2 py-0.5 text-xs font-bold text-white">
              {d.overrun}
            </span>
          )}
        </div>
      )}

      {task.status === 'blocked' && (
        <div className="mt-2 rounded-xl bg-red-50 p-2">
          <div className="text-xs font-bold text-red-700">{d.workerReport}</div>
          <div className="text-sm text-red-900">
            {blockedReason || he.common.none}
          </div>
          <button
            type="button"
            onClick={() => onReturnToWork(task)}
            className="mt-2 min-h-[44px] w-full rounded-lg border-2 border-statusRed px-3 font-bold text-red-600 hover:bg-red-100"
          >
            {d.returnToWork}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowUpdate(true)}
        className="mt-2 min-h-[44px] w-full rounded-lg bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
      >
        {d.managerUpdate}
      </button>

      <button
        type="button"
        onClick={() => setShowTimeline((v) => !v)}
        className="mt-2 min-h-[44px] w-full rounded-lg px-3 text-sm font-bold text-brand hover:bg-brand/5"
      >
        {he.media.openTimeline}
      </button>
      {showTimeline && (
        <div className="mt-2">
          <TaskTimeline taskId={task.id} />
        </div>
      )}

      {showUpdate && (
        <TextEntryModal
          title={d.updateTitle}
          placeholder={d.updatePlaceholder}
          submitLabel={d.sendUpdate}
          onSubmit={submitUpdate}
          onClose={() => setShowUpdate(false)}
        />
      )}
    </div>
  );
}
