import { he } from '../../../locales/he';
import AudioPlayer from '../../media/AudioPlayer';

// רצועת מדיה — ממוזערות תמונה עם תג שעה, ומתחתן נגני השמע.
export default function MediaStrip({ photos, voices, onPhoto }) {
  const hasAny = photos.length > 0 || voices.length > 0;
  if (!hasAny) {
    return (
      <p className="px-4 pb-4 text-sm text-grayLight sm:px-6">{he.tasks.drawer.noMedia}</p>
    );
  }

  const hhmm = (iso) =>
    new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="px-4 pb-4 sm:px-6">
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2 pb-1">
          {photos.map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onPhoto?.(ev.url)}
              className="relative"
              aria-label={he.media.photoAlt}
            >
              <img
                src={ev.url}
                alt={he.media.photoAlt}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
              <span
                className="absolute bottom-1 start-1 rounded bg-black/60 px-1 text-xs font-medium text-white"
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
