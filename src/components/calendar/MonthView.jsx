import { ymd, hhmm } from '../../lib/calendar';
import { he } from '../../locales/he';

const WD = he.calendar.weekdaysShort;
const MAX = 3;

// תצוגת חודש — גריד 7×N, צ'יפ לכל פגישה (עד 3 + "עוד").
export default function MonthView({ weeks, month, eventsByDate, onSlot, onEvent }) {
  const today = ymd(new Date());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-7 gap-1 pb-1">
          {WD.map((w, i) => (
            <div key={i} className="text-center text-xs font-bold text-grayMid">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((d) => {
            const key = ymd(d);
            const evs = eventsByDate[key] || [];
            const dim = d.getMonth() !== month;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSlot(key)}
                className={`flex min-h-[92px] flex-col rounded-lg border p-1 text-start ${
                  dim ? 'border-drLine/60 bg-appBg/40' : 'border-drLine bg-white'
                }`}
              >
                <span
                  className={`mb-1 self-end text-xs font-bold ${
                    isToday ? 'flex h-5 w-5 items-center justify-center rounded-full bg-drNavy text-white' : dim ? 'text-grayLight' : 'text-navy'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {d.getDate()}
                </span>
                <div className="space-y-0.5">
                  {evs.slice(0, MAX).map((e) => (
                    <span
                      key={e.key}
                      role="button"
                      tabIndex={0}
                      onClick={(ev) => { ev.stopPropagation(); onEvent(e); }}
                      className="block truncate rounded bg-drBlue/10 px-1 text-[11px] font-bold text-drBlue"
                    >
                      {hhmm(e.start)} {e.meeting.title}
                    </span>
                  ))}
                  {evs.length > MAX && (
                    <span className="block px-1 text-[11px] text-grayMid">
                      {he.calendar.moreN.replace('{n}', evs.length - MAX)}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
