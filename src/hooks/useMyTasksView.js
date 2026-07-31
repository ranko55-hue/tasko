import { useEffect, useState } from 'react';
import { readStringArray, writeJSON } from '../lib/storage';
import { he } from '../locales/he';

// העדפת תצוגת "המשימות שלי" בדסקטופ — שורות / כרטיסים.
//
// אותה תבנית כמו useBoardView, ובכוונה: מקור אמת יחיד לשני מקומות —
// המתג שעל המסך והמקטע בהגדרות. localStorage לבדו לא מודיע לרכיבים על
// שינוי, ולכן יש כאן רשימת מנויים קטנה.
//
// ⚠️ ההעדפה משפיעה על הדסקטופ בלבד. במובייל מסך העובד נשאר כפי שהוא —
// חוקת איש השטח (כפתורים ענקיים, פעולה ראשית אחת) אינה נתונה לבחירה.

const KEY = 'myTasks.view';
const VALID = ['rows', 'cards'];
export const DEFAULT_MY_TASKS_VIEW = 'rows';

export const MY_TASKS_VIEW_OPTIONS = [
  { key: 'rows', label: he.worker.viewRows },
  { key: 'cards', label: he.worker.viewCards },
];

const subscribers = new Set();

function read() {
  const [saved] = readStringArray(KEY);
  return VALID.includes(saved) ? saved : DEFAULT_MY_TASKS_VIEW;
}

export function useMyTasksView() {
  const [view, setView] = useState(DEFAULT_MY_TASKS_VIEW);

  useEffect(() => {
    setView(read());
    const onChange = (v) => setView(v);
    subscribers.add(onChange);

    // סנכרון בין לשוניות
    const onStorage = (e) => {
      if (e.key === KEY) setView(read());
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

  return [view, choose];
}
