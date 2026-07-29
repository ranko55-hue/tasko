import { mk } from './mockStrings';
import { lateness, dateLabel, isMultiDay } from './mockData';

const NUM = { fontVariantNumeric: 'tabular-nums' };

const DOT = {
  pending: 'bg-slate-400',
  scheduled: 'bg-statusBlue',
  in_progress: 'bg-statusGreen',
  paused: 'bg-brandYellow',
  blocked: 'bg-statusRed',
  done: 'bg-slate-300',
};

// תג איחור — שתי דרגות. "לא הוקצתה" חמורה יותר ולכן מלאה ולא רק מסגרת.
export function LateBadge({ task }) {
  const late = lateness(task);
  if (!late) return null;
  const severe = late === 'unassigned';
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
        severe ? 'bg-statusRed text-white' : 'border border-statusRed/40 bg-red-50 text-urgentInk'
      }`}
    >
      {severe ? mk.board.lateUnassigned : mk.board.lateWorking}
    </span>
  );
}

export function StatusDot({ status }) {
  return <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[status] ?? 'bg-slate-400'}`} />;
}

// מונה לקבוצה/טור/לשונית
export function Count({ n }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600" style={NUM}>
      {n}
    </span>
  );
}

// שורת משימה דחוסה — הבסיס לחלופות 2 ו-3.
// משימה רב-יומית מציגה טווח ואינה נחשבת חריגה רק בשל אורכה.
export function TaskRow({ task, onClick, expanded }) {
  const late = lateness(task);
  const range = isMultiDay(task);

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer border-b border-line px-3 py-2.5 transition-colors last:border-0 ${
        late ? 'bg-red-50/60 hover:bg-red-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <StatusDot status={task.status} />

        <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">
          {task.title}
        </span>

        <span className="hidden min-w-0 max-w-[9rem] truncate text-xs text-slate-500 sm:block">
          {task.client}
        </span>

        <span className="hidden w-24 shrink-0 truncate text-xs text-slate-500 md:block">
          {task.assignee ?? mk.board.unassigned}
        </span>

        <span
          className={`w-20 shrink-0 text-end text-xs ${range ? 'text-slate-700' : 'text-slate-500'}`}
          style={NUM}
        >
          {dateLabel(task)}
        </span>

        <LateBadge task={task} />
      </div>

      {expanded && (
        <div className="mt-2 rounded-lg bg-white p-2.5 text-xs text-slate-600 ring-1 ring-line">
          <div className="mb-1 font-bold text-slate-500">{mk.board.preview}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>{task.project ?? mk.board.noProject}</span>
            <span style={NUM}>
              {Math.round(task.net_seconds / 60)} / {task.est_minutes}
            </span>
            <span>{mk.status[task.status]}</span>
            {task.priority === 'urgent' && (
              <span className="font-bold text-urgentInk">{mk.chips.overrun}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
