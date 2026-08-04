import { he } from '../../../locales/he';
import { taskSubtitle } from '../../../lib/taskSubtitle';
import Icon from '../../ui/Icon';

const t = he.tasks;
const d = t.drawer;

// מילוי מלא לפי סטטוס לרצועת הסטטוס (שורה 4). צהוב = טקסט כהה.
const STATUS_FILL = {
  scheduled: { bg: '#2b5fa8', ink: '#ffffff' },
  pending: { bg: '#64748b', ink: '#ffffff' },
  in_progress: { bg: '#188a4e', ink: '#ffffff' },
  paused: { bg: '#f5c518', ink: '#161d24' },
  blocked: { bg: '#c53030', ink: '#ffffff' },
  pending_approval: { bg: '#7e22ce', ink: '#ffffff' },
  done: { bg: '#188a4e', ink: '#ffffff' },
  cancelled: { bg: '#64748b', ink: '#ffffff' },
};

const GHOST =
  'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg ' +
  'bg-white/[0.08] text-white transition-colors hover:bg-white/[0.16]';

function hhmm(iso) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// כותרת המגירה — navy-deep, פס תחתון צהוב 4px. תגים, זהות, ורצועת סטטוס.
export default function DrawerHeader({ task, assigneeName, onClose, onFullScreen }) {
  const status = task?.status;
  const fill = STATUS_FILL[status] ?? STATUS_FILL.pending;
  const clientProject = taskSubtitle(task);
  const who = assigneeName || t.unassigned;
  const started = task?.work_started_at ? hhmm(task.work_started_at) : null;

  return (
    <div className="sticky top-0 z-10 border-b-4 border-drYellow bg-drNavyDeep px-4 py-3 sm:px-6">
      {/* שורה 1 — תגים + מספר + סגירה */}
      <div className="flex items-center gap-2">
        {task?.priority === 'urgent' && (
          <span className="rounded-md bg-drRed px-2 py-0.5 text-xs font-bold text-white">
            {d.chipUrgent}
          </span>
        )}
        <span className="rounded-md border border-white/25 px-2 py-0.5 text-xs font-bold text-white">
          {t.status[status] ?? status}
        </span>
        <span className="text-xs text-white/60" style={{ fontVariantNumeric: 'tabular-nums' }}>
          #{task?.id}
        </span>
        <div className="ms-auto flex items-center gap-2">
          {onFullScreen && (
            <button type="button" onClick={onFullScreen} aria-label={d.fullScreen} className={GHOST}>
              <Icon name="expand" size="sm" strokeWidth={2} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label={d.close} className={GHOST}>
            <Icon name="close" size="sm" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* שורה 2 — שם המשימה */}
      <h2 className="mt-2 text-[19px] font-extrabold leading-snug text-white">{task?.title}</h2>

      {/* שורה 3 — לקוח · פרויקט */}
      {clientProject && <p className="mt-1 truncate text-sm text-white/70">{clientProject}</p>}

      {/* שורה 4 — רצועת סטטוס במילוי מלא + מי מבצע · מתי התחיל */}
      <div
        className="mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2"
        style={{ backgroundColor: fill.bg, color: fill.ink }}
      >
        <span className="text-sm font-bold">{t.status[status] ?? status}</span>
        <span className="truncate text-xs font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {who}{started ? ` · ${started}` : ''}
        </span>
      </div>
    </div>
  );
}
