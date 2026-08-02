import { useEffect, useRef, useState } from 'react';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';

const d = he.tasks.drawer;

// גלי קול קבועים — מדד ויזואלי להתקדמות, לא ניתוח אודיו אמיתי.
// גובה דטרמיניסטי לפי אינדקס, כדי שהצורה תהיה יציבה בין רינדורים.
const BARS = Array.from({ length: 28 }, (_, i) =>
  30 + Math.round(60 * Math.abs(Math.sin(i * 1.7)))
);

function mmss(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// נגן שמע מעוצב — מחליף את נגן הדפדפן בכל מקום שמופיעה הקלטה.
export default function AudioPlayer({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(Number.isFinite(a.duration) ? a.duration : 0);
    const onEnd = () => {
      setPlaying(false);
      setCur(0);
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
    };
  }, [src]);

  function toggle() {
    const a = ref.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  // התקדמות: לפני שיש משך ידוע נשארים על 0 ולא מנחשים
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  return (
    <div className="mt-2 flex items-center gap-3 rounded-xl bg-navy px-3 py-3">
      <audio ref={ref} src={src} preload="metadata" className="hidden" />

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? d.pause : d.play}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brandYellow text-navy transition-transform hover:scale-105"
      >
        <Icon name={playing ? 'pauseBars' : 'play'} size="sm" />
      </button>

      <div className="flex h-8 min-w-0 flex-1 items-center gap-1" aria-hidden="true">
        {BARS.map((h, i) => {
          const on = (i / BARS.length) * 100 <= pct;
          return (
            <span
              key={i}
              className={`w-1 shrink-0 rounded-full ${on ? 'bg-brandYellow' : 'bg-white/20'}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <span
        className="shrink-0 text-xs text-lineDark"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {mmss(dur > 0 ? (playing || cur > 0 ? cur : dur) : 0)}
      </span>
    </div>
  );
}
