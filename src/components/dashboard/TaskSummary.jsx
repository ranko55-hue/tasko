import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { STATUS_DOT } from '../ui/StatusPill';
import { isOverrun } from '../../lib/dashboardModel';
import { isRunning } from '../../lib/taskTime';
import { elapsedSeconds, approveTask } from '../../lib/taskFlow';
import { formatDuration } from '../../lib/time';
import Icon from '../ui/Icon';

const b = he.dashboard.board;

// תבנית הגריד המשותפת לכותרת העמודות ולשורות — כדי שהטורים יישרו תמיד.
// RTL: פס סטטוס | משימה | לקוח·פרויקט | מבצע | דחיפות | טיימר | פעולה
export const ROW_GRID = 'grid-cols-[4px_minmax(0,1.7fr)_minmax(0,1.2fr)_100px_56px_110px_104px] gap-[14px]';

const NUM = { fontVariantNumeric: 'tabular-nums' };

function activeOverrun(task) {
  return isOverrun(task) && !task.overrun_acknowledged;
}

// אייקון דחיפות — משולש אזהרה אדום=דחוף · עיגול+קו אפור=רגיל. tooltip בשם.
function UrgencyIcon({ task }) {
  const urgent = task.priority === 'urgent';
  return (
    <span title={urgent ? b.priUrgent : b.priNormal} className="inline-flex">
      <Icon
        name={urgent ? 'alert' : 'priNormal'}
        size="md"
        strokeWidth={2}
        className={urgent ? 'text-drRed' : 'text-grayLight'}
      />
    </span>
  );
}

// טיימר — רץ (ירוק/אדום), טרם התחיל, או נטו סופי.
function TimerCell({ task }) {
  const running = isRunning(task);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const closed = ['done', 'cancelled'].includes(task.status);
  if (closed) {
    return <span className="text-[13px] text-grayMid" style={NUM}>{b.net} {formatDuration(task.net_seconds)}</span>;
  }
  if (running) {
    const over = activeOverrun(task);
    return (
      <span className={`inline-flex items-center gap-1.5 text-[15px] font-extrabold ${over ? 'text-drRed' : 'text-drGreen'}`} style={NUM}>
        <span className={`h-2 w-2 rounded-full ${over ? 'bg-drRed' : 'bg-drGreen'} animate-softPulse`} />
        {formatDuration(elapsedSeconds(task))}
      </span>
    );
  }
  if (task.net_seconds > 0) {
    return <span className="text-[13px] text-grayMid" style={NUM}>{formatDuration(task.net_seconds)}</span>;
  }
  return <span className="text-xs font-semibold text-grayMid">{b.notStarted}</span>;
}

// כפתור הקשר — רק כשנדרשת החלטה. אחרת null (לחיצת שורה/כרטיס פותחת מגירה).
function ActionButton({ task, currentMemberId, onOpenTask, onRefresh, full }) {
  const base = `flex h-[30px] items-center justify-center rounded-lg px-3 text-xs font-bold text-white ${full ? 'w-full' : 'w-full'}`;
  if (activeOverrun(task)) {
    return (
      <button type="button" className={`${base} bg-drRed`} onClick={(e) => { e.stopPropagation(); onOpenTask?.(task.id); }}>
        {b.clarify}
      </button>
    );
  }
  if (task.status === 'pending_approval') {
    return (
      <button
        type="button"
        className={`${base} bg-drGreen`}
        onClick={async (e) => {
          e.stopPropagation();
          await approveTask(task, currentMemberId);
          onRefresh?.();
        }}
      >
        {b.approveClose}
      </button>
    );
  }
  return null;
}

function needsAction(task) {
  return activeOverrun(task) || task.status === 'pending_approval';
}

// תוכן משימה משותף. variant='row' → גריד מיושר · 'card' → מוערם.
export default function TaskSummary({ task, assigneeName, variant, currentMemberId, onOpenTask, onRefresh }) {
  const name = task.title;
  const client = task.client?.name ?? he.common.none;
  const project = task.project?.name;
  const clientProject = project ? `${client} · ${project}` : client;
  const assignee = assigneeName || he.tasks.unassigned;
  const statusBar = STATUS_DOT[task.status] ?? 'bg-grayLight';
  const action = (
    <ActionButton task={task} currentMemberId={currentMemberId} onOpenTask={onOpenTask} onRefresh={onRefresh} />
  );

  const nameCell = (
    <span className="min-w-0 truncate text-[13.5px] font-bold text-navy" title={`#${task.id} ${name}`}>
      <span className="text-grayLight" style={NUM}>#{task.id}</span> {name}
    </span>
  );
  const clientCell = (
    <span className="min-w-0 truncate text-xs text-grayMid" title={clientProject}>
      <span className="font-bold text-grayDark">{client}</span>{project ? ` · ${project}` : ''}
    </span>
  );
  const assigneeCell = <span className="min-w-0 truncate text-xs text-grayMid" title={assignee}>{assignee}</span>;

  if (variant === 'card') {
    return (
      <div
        onClick={() => onOpenTask?.(task.id)}
        className="cursor-pointer rounded-lg border border-drLine bg-white p-3 transition-colors hover:border-lineDark"
      >
        <div className="mb-1">{nameCell}</div>
        <div className="mb-2">{clientCell}</div>
        <div className="flex items-center justify-between gap-2">
          {assigneeCell}
          <UrgencyIcon task={task} />
        </div>
        <div className="mt-2"><TimerCell task={task} /></div>
        {needsAction(task) && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  // variant === 'row'
  return (
    <div
      onClick={() => onOpenTask?.(task.id)}
      className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-surface"
    >
      {/* דסקטופ — גריד מיושר */}
      <div className={`hidden ${ROW_GRID} min-h-[52px] items-center px-[14px] sm:grid`}>
        <span className={`h-[26px] w-1 rounded-[2px] ${statusBar}`} aria-hidden="true" />
        {nameCell}
        {clientCell}
        {assigneeCell}
        <span className="flex justify-center"><UrgencyIcon task={task} /></span>
        <TimerCell task={task} />
        <div>{needsAction(task) ? action : null}</div>
      </div>

      {/* מובייל — שתי שורות פנימיות, בלי גלילה אופקית */}
      <div className="flex items-stretch gap-2 py-2 pe-3 sm:hidden">
        <span className={`w-1 shrink-0 rounded ${statusBar}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1">{nameCell}</span>
            <UrgencyIcon task={task} />
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            {clientCell}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            {assigneeCell}
            <TimerCell task={task} />
          </div>
          {needsAction(task) && <div className="mt-2">{action}</div>}
        </div>
      </div>
    </div>
  );
}
