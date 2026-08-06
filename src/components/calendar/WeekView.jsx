import { ymd, hhmm } from '../../lib/calendar';
import { he } from '../../locales/he';

const WD = he.calendar.weekdaysShort;
const todayStr = () => ymd(new Date());

// תצוגת שבוע — 7 עמודות יום, גריד עצמי רזה. במובייל נגללת אופקית.
export default function WeekView({ days, eventsByDate, onSlot, onEvent }) {
  const today = todayStr();
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {days.map((d) => {
        const key = ymd(d);
        const isToday = key === today;
        const evs = eventsByDate[key] || [];
        return (
          <div key={key} className="min-w-[132px] flex-1 rounded-lg border border-drLine bg-white">
            <button
              type="button"
              onClick={() => onSlot(key)}
              className={`flex w-full items-center justify-between rounded-t-lg px-2 py-1.5 text-start ${
                isToday ? 'bg-drNavy text-white' : 'bg-surface text-navy'
              }`}
            >
              <span className="text-xs font-bold">{WD[d.getDay()]}</span>
              <span className="text-sm font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</span>
            </button>

            <div className="min-h-[120px] space-y-1 p-1.5" onClick={() => onSlot(key)}>
              {evs.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={(ev) => { ev.stopPropagation(); onEvent(e); }}
                  className="block w-full rounded-md border-r-2 border-drBlue bg-drBlue/10 px-2 py-1 text-start"
                >
                  <div className="text-[11px] font-bold text-drBlue" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {hhmm(e.start)}
                  </div>
                  <div className="truncate text-xs font-bold text-navy">{e.meeting.title}</div>
                  {e.meeting.client?.name && (
                    <div className="truncate text-[11px] text-grayMid">{e.meeting.client.name}</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
