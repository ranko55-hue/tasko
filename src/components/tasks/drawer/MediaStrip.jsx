import { he } from '../../../locales/he';
import AudioPlayer from '../../media/AudioPlayer';

// רצועת מדיה — ממוזערות תמונה עם תג שעה, ומתחתן נגני השמע.
export default function MediaStrip({ photos, voices, onPhoto }) {
  const hasAny = photos.length > 0 || voices.length > 0;
  if (!hasAny) {
    return (
      <p className="px-4 pb-4 text-sm text-slate-400 sm:px-5">{he.tasks.drawer.noMedia}</p>
    );
  }

  const hhmm = (iso) =>
    new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="px-4 pb-4 sm:px-5">
      {photos.length > 0 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {photos.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onPhoto?.(ev.url)}
              className="relative shrink-0"
              aria-label={he.media.photoAlt}
            >
              <img
                src={ev.url}
                alt={he.media.photoAlt}
                loading="lazy"
                className="h-[58px] w-[58px] rounded-xl object-cover"
              />
              <span
                className="absolute bottom-1 start-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {hhmm(ev.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}

      {voices.map((ev) => (
        <AudioPlayer key={ev.id} src={ev.url} />
      ))}
    </div>
  );
}
