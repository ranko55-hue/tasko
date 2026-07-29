import { he } from '../../../locales/he';
import {
  usedMinutes,
  allocatedMinutes,
  overrunMinutes,
  isOverTime,
  usagePercent,
  humanMinutes,
} from '../../../lib/taskTime';

const d = he.tasks.drawer;
const NUM = { fontVariantNumeric: 'tabular-nums' };

// קופסת ניצול הזמן. בחריגה — גוונים אדומים רכים וסמן ב-100%;
// אחרת — קופסה ניטרלית עם פס ירוק.
export default function TimeBox({ task }) {
  const est = allocatedMinutes(task);
  if (!est) return null;

  const used = usedMinutes(task);
  const over = isOverTime(task);
  const pct = usagePercent(task);

  // בחריגה הפס מלא והסמן מסמן היכן היה ה-100%
  const fill = over ? 100 : Math.min(100, pct);
  const markerAt = over ? Math.round((est / used) * 100) : null;

  const title = over
    ? d.overTitle.replace('{amount}', humanMinutes(overrunMinutes(task), he))
    : d.onTrackTitle;

  return (
    <div
      className={`mx-4 mb-4 rounded-xl border p-3 sm:mx-5 ${
        over ? 'border-overrunLine bg-overrunSoft' : 'border-line bg-white'
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className={`text-sm font-bold ${over ? 'text-urgentInk' : 'text-slate-700'}`}>
          {title}
        </span>
        <span className="text-xs text-slate-500" style={NUM}>
          {used} / {est} {he.time.minutes}
        </span>
      </div>

      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${fill}%`,
            backgroundImage: over
              ? 'linear-gradient(90deg, #F97316, #EF4444)'
              : 'linear-gradient(90deg, #22C55E, #16A34A)',
          }}
        />
        {markerAt !== null && markerAt < 100 && (
          // סמן דק בנקודה שבה נגמר המוקצב
          <span
            className="absolute top-0 h-full w-0.5 bg-white/90"
            style={{ insetInlineStart: `${markerAt}%` }}
          />
        )}
      </div>

      <div className="mt-1.5 text-[11px] text-slate-500">{d.usedOfAllocated}</div>
    </div>
  );
}
