import { he } from '../../../locales/he';
import { describeEdit } from '../../../lib/taskEdits';
import Icon from '../../ui/Icon';

const m = he.media;
const NUM = { fontVariantNumeric: 'tabular-nums' };

// עדכון מנהל מודגש במירכאות; שאר הסוגים כטקסט רגיל
const QUOTED = ['manager_attachment'];
const WITH_TEXT = ['text_note', 'manager_attachment', 'blocked', 'cancelled'];

// אירועי מנהל בצהוב, אירועי עובד בירוק
function dotTone(type) {
  return type === 'manager_attachment'
    ? 'bg-brandYellow ring-brandYellow/25'
    : 'bg-statusGreen ring-statusGreen/25';
}

function hhmm(iso) {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// ציר זמן — קו מחבר, נקודות עם טבעת, וממוזערת אינליין לאירועי מדיה.
export default function TimelineList({ events, onPhoto }) {
  if (!events.length) {
    return <p className="px-4 pb-4 text-sm text-slate-400 sm:px-5">{m.timelineEmpty}</p>;
  }

  return (
    <ol className="relative px-4 pb-2 sm:px-5">
      {/* הקו המחבר — מאחורי הנקודות */}
      <span
        className="absolute top-2 bottom-6 w-px bg-line"
        style={{ insetInlineStart: '1.4rem' }}
        aria-hidden="true"
      />

      {events.map((ev) => {
        const text = WITH_TEXT.includes(ev.type) && ev.payload?.text;
        const edits = ev.type === 'edited' ? describeEdit(ev.payload) : [];
        const label = m.eventTypes[ev.type] ?? ev.type;
        const actor = ev.actor?.full_name;

        return (
          <li key={ev.id} className="relative flex gap-3 py-2.5">
            <span
              className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ${dotTone(ev.type)}`}
            />

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-800">{label}</div>

              {text && (
                <p
                  className={`mt-0.5 text-sm text-slate-700 ${
                    QUOTED.includes(ev.type) ? 'italic' : ''
                  }`}
                >
                  {QUOTED.includes(ev.type) ? `״${text}״` : text}
                </p>
              )}

              {edits.length > 0 && (
                <ul className="mt-0.5 space-y-0.5">
                  {edits.map((line, i) => (
                    <li key={i} className="text-sm text-slate-700">
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-1 text-xs text-slate-400" style={NUM}>
                {hhmm(ev.created_at)}
                {actor && <span className="mx-1 text-slate-300">·</span>}
                {actor}
              </div>
            </div>

            {/* ממוזערת אינליין 26px */}
            {['photo', 'manager_attachment'].includes(ev.type) && ev.url && (
              <button
                type="button"
                onClick={() => onPhoto?.(ev.url)}
                className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center p-2"
                aria-label={m.photoAlt}
              >
                <img
                  src={ev.url}
                  alt={m.photoAlt}
                  loading="lazy"
                  className="h-[26px] w-[26px] rounded object-cover"
                />
              </button>
            )}
            {ev.type === 'voice_note' && (
              <span className="mt-1 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded bg-navy text-brandYellow">
                <Icon name="mic" size="sm" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
