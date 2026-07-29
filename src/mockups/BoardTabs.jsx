import { useState } from 'react';
import { mk } from './mockStrings';
import { MOCK_TASKS, sortByUrgency, lateness } from './mockData';
import { TaskRow, Count } from './MockBits';

// סיווג לפי סוג העבודה — נגזר מהכותרת, כי לדמה אין שדה קטגוריה.
const RULES = [
  { key: 'electric', words: ['תאורה', 'חשמל', 'מצלמות', 'תקשורת', 'חירום'] },
  { key: 'plumbing', words: ['צנרת', 'דליפה', 'ביוב', 'ניקוז', 'רטיבות', 'איטום', 'רטוב'] },
  { key: 'safety', words: ['אש', 'כיבוי', 'בטיחות', 'גדר', 'מעקות', 'שילוט'] },
];

function kind(task) {
  for (const r of RULES) {
    if (r.words.some((w) => task.title.includes(w))) return r.key;
  }
  return 'maintenance';
}

const TABS = ['all', 'electric', 'plumbing', 'safety', 'maintenance'];

// חלופה 3 — לשונית לכל סוג משימה, ובתוכה הרשימה של אותו נושא.
export default function BoardTabs() {
  const [tab, setTab] = useState('all');
  const [row, setRow] = useState(null);

  const counts = TABS.reduce((acc, k) => {
    acc[k] = k === 'all' ? MOCK_TASKS.length : MOCK_TASKS.filter((t) => kind(t) === k).length;
    return acc;
  }, {});

  const list = sortByUrgency(
    tab === 'all' ? MOCK_TASKS : MOCK_TASKS.filter((t) => kind(t) === tab)
  );
  const lateCount = list.filter(lateness).length;

  return (
    <section className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
      <h3 className="mb-3 px-1 text-sm font-black text-slate-500">{mk.board.areaTitle}</h3>

      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex min-h-touch shrink-0 items-center gap-2 rounded-xl border-2 px-3 text-sm font-bold transition-colors ${
              tab === k
                ? 'border-brand bg-brand text-white'
                : 'border-line bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {mk.board.tabs[k]}
            <span
              className={`rounded-full px-1.5 text-xs ${
                tab === k ? 'bg-white/20' : 'bg-slate-100 text-slate-600'
              }`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {counts[k]}
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {lateCount > 0 && (
          <div className="flex items-center gap-2 border-b border-line bg-red-50 px-3 py-2">
            <span className="text-xs font-bold text-urgentInk">{mk.board.groups.late}</span>
            <Count n={lateCount} />
          </div>
        )}
        {list.length === 0 ? (
          <p className="px-3 py-4 text-xs text-slate-400">{mk.board.empty}</p>
        ) : (
          list.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              expanded={row === t.id}
              onClick={() => setRow(row === t.id ? null : t.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
