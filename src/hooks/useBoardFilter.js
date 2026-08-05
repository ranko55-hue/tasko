import { useEffect, useState } from 'react';
import { readStringArray, writeJSON } from '../lib/storage';
import { he } from '../locales/he';

// העדפת מסנן הלוח — כל המשימות / המשימות שלי.
//
// אותה תבנית של useBoardView: מקור אמת יחיד עם מנויים כדי שבחירה תרנדר
// מיד את כל מי שמשתמש בהוק, ושמירה ב-localStorage כמו שאר העדפות התצוגה.

const KEY = 'dashboard.boardFilter';
const VALID = ['all', 'mine'];
export const DEFAULT_FILTER = 'all';

// האפשרויות עוברות ל-ViewToggle הגנרי — אותה שפה בדיוק של מתג שורות/עמודות
export const BOARD_FILTER_OPTIONS = [
  { key: 'all', label: he.dashboard.allTasks },
  { key: 'mine', label: he.dashboard.myTasksFilter },
];

const subscribers = new Set();

function read() {
  const [saved] = readStringArray(KEY);
  return VALID.includes(saved) ? saved : DEFAULT_FILTER;
}

export function useBoardFilter() {
  const [filter, setFilter] = useState(DEFAULT_FILTER);

  useEffect(() => {
    setFilter(read());
    const onChange = (v) => setFilter(v);
    subscribers.add(onChange);

    const onStorage = (e) => {
      if (e.key === KEY) setFilter(read());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      subscribers.delete(onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function choose(next) {
    if (!VALID.includes(next)) return;
    writeJSON(KEY, [next]);
    subscribers.forEach((fn) => fn(next));
  }

  return [filter, choose];
}
