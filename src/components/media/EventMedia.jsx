import { he } from '../../locales/he';

// רנדור מדיה של אירוע — תמונה ממוזערת או נגן שמע.
// רכיב אחד משותף לכל מקום שהציר מופיע: מסך העובד, TaskDrawer, וכרטיס הלוח.
export default function EventMedia({ event, size = 'md', onPhoto }) {
  if (!event?.url) return null;

  const dim = size === 'sm' ? 'h-14 w-14' : 'h-24 w-24';

  if (event.type === 'photo') {
    return (
      <button
        type="button"
        onClick={() => onPhoto?.(event.url)}
        className="mt-2 block"
        aria-label={he.media.photoAlt}
      >
        <img
          src={event.url}
          alt={he.media.photoAlt}
          loading="lazy"
          className={`${dim} rounded-lg object-cover`}
        />
      </button>
    );
  }

  if (event.type === 'voice_note') {
    return <audio controls preload="none" src={event.url} className="mt-2 w-full" />;
  }

  return null;
}
