import { he } from '../../../locales/he';
import { STATUS_DOT, STATUS_INK } from '../../ui/StatusPill';
import { isActiveStatus } from '../../../lib/taskTime';
import { taskSubtitle } from '../../../lib/taskSubtitle';
import Icon from '../../ui/Icon';

const t = he.tasks;
const d = t.drawer;

const GHOST =
  'flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.08] ' +
  'text-line transition-colors hover:bg-white/[0.16]';

// כותרת המגירה — פס navy עם מדרג, סטטוס, זהות המשימה ופעולות חלון.
export default function DrawerHeader({ task, onClose, onFullScreen }) {
  const status = task?.status;
  const subtitle = taskSubtitle(task);

  return (
    <div
      className="sticky top-0 z-10 px-4 py-3 sm:px-6"
      style={{ backgroundImage: 'linear-gradient(135deg, #0F172A, #1E293B)' }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${STATUS_DOT[status] ?? 'bg-grayLight'} ${
                isActiveStatus(status) ? 'animate-softPulse' : ''
              }`}
            />
            <span className={`text-xs font-bold ${STATUS_INK[status] ?? 'text-lineDark'}`}>
              {t.status[status] ?? status}
            </span>
            <span className="text-xs text-grayLight" style={{ fontVariantNumeric: 'tabular-nums' }}>
              #{task?.id}
            </span>
          </div>

          <h2 className="mt-2 text-base font-bold leading-snug text-white">
            {task?.title}
          </h2>

          {subtitle && (
            <p className="mt-1 truncate text-sm text-grayLight">{subtitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onFullScreen && (
            <button type="button" onClick={onFullScreen} aria-label={d.fullScreen} className={GHOST}>
              <Icon name="expand" size="sm" />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label={d.close} className={GHOST}>
            <Icon name="close" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
