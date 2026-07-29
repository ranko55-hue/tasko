import { useState } from 'react';
import { mk } from '../mockups/mockStrings';
import { MOCK_TASKS } from '../mockups/mockData';
import TopBlockMockup from '../mockups/TopBlockMockup';
import BoardColumns from '../mockups/BoardColumns';
import BoardGrouped from '../mockups/BoardGrouped';
import BoardTabs from '../mockups/BoardTabs';

const VIEWS = [
  { key: 'top', label: mk.index.partA, El: TopBlockMockup },
  { key: 'columns', label: mk.index.optColumns, El: BoardColumns },
  { key: 'grouped', label: mk.index.optGrouped, El: BoardGrouped },
  { key: 'tabs', label: mk.index.optTabs, El: BoardTabs },
];

// מסך המוקאפים — סטטי, נתוני דמה בלבד. לא נוגע בשום מסך חי.
export default function MockupsPage() {
  const [view, setView] = useState('top');
  const Current = VIEWS.find((v) => v.key === view).El;

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      <h1 className="text-xl font-black text-slate-900">{mk.index.title}</h1>
      <p className="mt-1 text-sm text-slate-500">{mk.index.subtitle}</p>
      <p className="mt-0.5 text-xs text-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {mk.index.tasksCount} · {MOCK_TASKS.length}
      </p>

      <div className="-mx-1 my-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`min-h-touch shrink-0 rounded-xl border-2 px-3 text-sm font-bold transition-colors ${
              view === v.key
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <Current />
    </div>
  );
}
