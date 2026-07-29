import { useNavigate } from 'react-router-dom';
import { he } from '../../locales/he';

const b = he.brief;
const NUM = { fontVariantNumeric: 'tabular-nums' };
const CHIP =
  'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold';

// שורת התדריך הדחוסה — מלווה כל מסך במערכת.
// מציגה צ'יפ רק למה שקיים בפועל; כשאין כלום — "הכל תקין".
// לחיצה על צ'יפ מנווטת ללוח, שם יושב התדריך המלא.
export default function BriefingBar({ alerts, live }) {
  const navigate = useNavigate();

  const chips = [
    { key: 'overrun', n: alerts?.overrun ?? 0, label: b.overrun, cls: 'bg-statusRed text-white' },
    { key: 'late', n: alerts?.unclosed ?? 0, label: b.late, cls: 'bg-red-500/20 text-red-300' },
    { key: 'blocked', n: alerts?.delayed ?? 0, label: b.blocked, cls: 'bg-red-500/20 text-red-300' },
    {
      key: 'calls',
      n: alerts?.new_calls ?? 0,
      label: null, // לקריאות יש ניסוח ליחיד ולרבים
      cls: 'bg-brandYellow/20 text-brandYellow',
    },
  ].filter((c) => c.n > 0);

  return (
    <div className="border-t border-white/10 bg-navy2">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
        {/* מחוון החיבור — עבר לשורה הזו כדי שיהיה גלוי בכל מסך */}
        <span
          title={live ? he.dashboard.live : he.dashboard.polling}
          aria-label={live ? he.dashboard.live : he.dashboard.polling}
          className={`h-2 w-2 shrink-0 rounded-full ${
            live ? 'animate-softPulse bg-statusGreen' : 'bg-slate-500'
          }`}
        />

        {chips.length === 0 ? (
          <span className={`${CHIP} bg-statusGreen/15 text-statusGreen`}>{b.allClear}</span>
        ) : (
          chips.map((c, i) => (
            <span key={c.key} className="flex shrink-0 items-center gap-2">
              {i > 0 && <span className="text-white/25">·</span>}
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                aria-label={b.goToBoard}
                className={`${CHIP} ${c.cls} transition-opacity hover:opacity-80`}
                style={NUM}
              >
                {c.key === 'calls'
                  ? `${c.n} ${c.n === 1 ? b.newCallOne : b.newCalls}`
                  : `${c.n} ${c.label}`}
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}
