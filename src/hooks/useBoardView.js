import { useEffect, useState } from 'react';
import { readStringArray, writeJSON } from '../lib/storage';
import { he } from '../locales/he';

// העדפת תצוגת הלוח — עמודות / שורות.
//
// מקור אמת יחיד לשני מקומות: המתג שעל הלוח והמקטע במסך ההגדרות.
// localStorage לבדו לא מודיע לרכיבים על שינוי, ולכן יש כאן רשימת מנויים
// קטנה — שינוי בכל מקום מרנדר מחדש את כל מי שמשתמש בהוק, מיד.

const KEY = 'dashboard.boardView';
const VALID = ['columns', 'rows'];
export const DEFAULT_VIEW = 'rows'; // ברירת מחדל למי שטרם בחר

// האפשרויות עוברות ל-ViewToggle הגנרי — התוויות מ-he.js, לא מתוך הפקד
export const BOARD_VIEW_OPTIONS = [
  { key: 'columns', label: he.dashboard.viewColumns },
  { key: 'rows', label: he.dashboard.viewRows },
];

const subscribers = new Set();

function read() {
  const [saved] = readStringArray(KEY);
  return VALID.includes(saved) ? saved : DEFAULT_VIEW;
}

export function useBoardView() {
  const [view, setView] = useState(DEFAULT_VIEW);

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
