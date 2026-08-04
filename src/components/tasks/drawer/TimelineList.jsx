import { he } from '../../../locales/he';
import { describeEdit } from '../../../lib/taskEdits';
import Icon from '../../ui/Icon';

const m = he.media;
const NUM = { fontVariantNumeric: 'tabular-nums' };

// עדכון מנהל מודגש במירכאות; שאר הסוגים כטקסט רגיל
const QUOTED = ['manager_attachment'];
const WITH_TEXT = ['text_note', 'manager_attachment', 'blocked', 'cancelled'];

// ריבועי צבע לפי משמעות: ירוק=התחלה/סטטוס, כחול=תיעוד, אפור=מערכת.
const DOC = ['photo', 'voice_note', 'text_note', 'manager_attachment'];
const STATUS = ['started', 'resumed', 'finished', 'unblocked', 'approved', 'status_change', 'pending_approval'];
function squareTone(type) {
  if (DOC.includes(type)) return 'bg-drBlue';
  if (STATUS.includes(type)) return 'bg-drGreen';
  return 'bg-grayLight';
}

function stamp(iso) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}, ${hh}:${mi}`;
}

// ציר זמן — קו מחבר, נקודות עם טבעת, וממוזערת אינליין לאירועי מדיה.
export default function TimelineList({ events, onPhoto }) {
  if (!events.length) {
    return <p className="px-4 pb-4 text-sm text-grayLight sm:px-6">{m.timelineEmpty}</p>;
  }

  return (
    <ol className="relative px-4 pb-2 sm:px-6">
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
          <li key={ev.id} className="relative flex gap-3 py-3">
            <span
              className={`relative z-10 mt-2 h-3 w-3 shrink-0 rounded-[2px] ${squareTone(ev.type)}`}
            />

            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-navy2">{label}</div>

              {text && (
                <p
                  className={`mt-1 text-sm text-inkSoft ${
                    QUOTED.includes(ev.type) ? 'italic' : ''
                  }`}
                >
                  {QUOTED.includes(ev.type) ? `״${text}״` : text}
                </p>
              )}

              {edits.length > 0 && (
                <ul className="mt-1 space-y-1">
                  {edits.map((line, i) => (
                    <li key={i} className="text-sm text-inkSoft">
                      {line}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-1 text-xs text-grayLight" style={NUM}>
                {stamp(ev.created_at)}
                {actor && <span className="mx-1 text-lineDark">·</span>}
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
