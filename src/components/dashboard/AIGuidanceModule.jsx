import { useState } from 'react';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';

const t = he.dashboard;

const STATUS_ORDER = [
  'scheduled', 'pending', 'in_progress', 'paused',
  'blocked', 'pending_approval', 'done',
];
const STATUS_COLORS = {
  scheduled: 'bg-grayLight',
  pending: 'bg-statusBlue',
  in_progress: 'bg-statusGreen',
  paused: 'bg-brandYellow',
  blocked: 'bg-statusRed',
  pending_approval: 'bg-purple-500',
  done: 'bg-statusGreen',
};
const STATUS_DOT = {
  scheduled: 'bg-grayLight',
  pending: 'bg-statusBlue',
  in_progress: 'bg-statusGreen',
  paused: 'bg-brandYellow',
  blocked: 'bg-statusRed',
  pending_approval: 'bg-purple-500',
  done: 'bg-statusGreen/60',
};

function CounterRow({ statusCounts }) {
  return (
    <div className="overflow-x-auto pb-1 -mx-4 px-4">
      <div className="flex gap-2 min-w-min">
        {STATUS_ORDER.map((s) => (
          <span
            key={s}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-navy2 px-3 py-1 text-xs font-bold text-white"
          >
            <span className={`h-2 w-2 rounded-full ${STATUS_DOT[s]}`} />
            {t.statusLabels[s]}
            <span className="opacity-70">{statusCounts[s] ?? 0}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const BTN_CLASS = {
  approval: 'bg-statusGreen hover:bg-statusGreen/80 text-white',
  blocked: 'bg-statusRed hover:bg-statusRed/80 text-white',
  overrun: 'bg-statusRed hover:bg-statusRed/80 text-white',
  call: 'bg-statusBlue hover:bg-statusBlue/80 text-white',
};

function ActionItem({ item, membersMap, onAction, onOpenTask }) {
  const { task, kind, reason } = item;
  const assigneeName = membersMap?.[task.assignee_id] ?? he.tasks.unassigned;

  return (
    <div className="flex items-center gap-2 rounded-lg bg-navy2 px-3 py-2 text-xs">
      <button
        type="button"
        onClick={() => onOpenTask?.(task.id)}
        className="min-w-0 flex-1 text-start"
      >
        <div className="font-bold text-white truncate">
          #{task.id} {task.title}
        </div>
        <div className="text-grayLight truncate">
          {assigneeName}
          {kind === 'blocked' && reason ? ` · ${reason}` : ''}
          {kind === 'overrun' ? ` · ${t.queue.overrunActive}` : ''}
          {kind === 'approval' ? ` · ${t.queue.pendingApproval}` : ''}
        </div>
      </button>
      <div className="flex shrink-0 gap-1.5">
        {kind === 'approval' && (
          <button
            type="button"
            onClick={() => onAction('approve', task)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${BTN_CLASS.approval}`}
          >
            {t.queue.approve}
          </button>
        )}
        {kind === 'blocked' && (
          <button
            type="button"
            onClick={() => onAction('clarify', task)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${BTN_CLASS.blocked}`}
          >
            {t.queue.clarify}
          </button>
        )}
        {kind === 'overrun' && (
          <>
            {task.assignee_id && membersMap?._phones?.[task.assignee_id] && (
              <a
                href={`tel:${membersMap._phones[task.assignee_id]}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${BTN_CLASS.call}`}
              >
                {t.queue.call}
              </a>
            )}
            <button
              type="button"
              onClick={() => onAction('acknowledge', task)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${BTN_CLASS.overrun}`}
            >
              {t.queue.acknowledge}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function HandledSection({ handledTasks, membersMap, onOpenTask }) {
  const [open, setOpen] = useState(false);
  if (!handledTasks?.length) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-xs font-bold text-lineDark hover:text-white transition-colors"
      >
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size="sm" />
        {t.queue.handledToday} ({handledTasks.length})
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {handledTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask?.(task.id)}
              className="flex w-full items-center gap-2 rounded-lg bg-navy2/50 px-3 py-2 text-xs text-start opacity-60 hover:opacity-80 transition-opacity"
            >
              <Icon name="check" size="sm" className="text-statusGreen" />
              <span className="font-bold text-white truncate">#{task.id} {task.title}</span>
              <span className="text-grayLight truncate mr-auto">
                {membersMap?.[task.assignee_id] ?? ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AIGuidanceModule({
  statusCounts = {},
  actionQueue = [],
  handledTasks = [],
  membersMap = {},
  live = false,
  onOpenTask,
  onAction,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasItems = actionQueue.length > 0;

  return (
    <div className="mb-6 bg-navy px-4 py-3 rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-black text-white">
          <Icon name="ai" />
          {t.aiTitle}
          <span
            title={live ? t.live : t.polling}
            aria-label={live ? t.live : t.polling}
            className={`h-2 w-2 rounded-full ${
              live ? 'animate-pulse bg-statusGreen' : 'bg-grayMid'
            }`}
          />
        </h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? t.collapse : t.expand}
          className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-1.5
                     text-xs font-bold text-white transition-all
                     hover:bg-white/25 active:scale-95"
        >
          <span>{isOpen ? t.collapse : t.expand}</span>
          <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="sm" />
        </button>
      </div>

      {/* Counter row — 7 statuses as color legend */}
      <CounterRow statusCounts={statusCounts} />

      {/* Panel — action queue */}
      {isOpen && (
        <div className="mt-3 border-t border-navy2 pt-3">
          <div className="mb-2 text-xs font-bold text-lineDark">{t.queue.title}</div>
          {hasItems ? (
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {actionQueue.map((item) => (
                <ActionItem
                  key={`${item.kind}-${item.task.id}`}
                  item={item}
                  membersMap={membersMap}
                  onAction={onAction}
                  onOpenTask={onOpenTask}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-grayLight">{t.queue.empty}</p>
          )}

          {/* Handled today — collapsed section */}
          <HandledSection
            handledTasks={handledTasks}
            membersMap={membersMap}
            onOpenTask={onOpenTask}
          />
        </div>
      )}
    </div>
  );
}
