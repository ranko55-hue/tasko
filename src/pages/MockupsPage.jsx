import { useState } from 'react';
import { mkMy } from '../mockups/myTasksStrings';
import MyTasksRows from '../mockups/MyTasksRows';
import MyTasksCards from '../mockups/MyTasksCards';

const VIEWS = [
  { key: 'rows', label: mkMy.index.optRows, El: MyTasksRows },
  { key: 'cards', label: mkMy.index.optCards, El: MyTasksCards },
];

// מסך המוקאפים — סטטי, נתוני דמה בלבד. אינו נוגע במסך העובד החי,
// ולכן המובייל (390) של "המשימות שלי" נשאר כפי שהוא בדיוק.
export default function MockupsPage() {
  const [view, setView] = useState('rows');
  const Current = VIEWS.find((v) => v.key === view).El;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-black text-slate-900">{mkMy.index.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">{mkMy.index.subtitle}</p>
        <p className="mt-0.5 text-xs text-slate-400">{mkMy.index.widthNote}</p>

        <div className="my-5 flex gap-2">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className={`min-h-touch shrink-0 rounded-xl border-2 px-4 text-sm font-bold transition-colors ${
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
    </div>
  );
}
