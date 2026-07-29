import { useState } from 'react';
import { mk } from './mockStrings';
import { MOCK_TASKS, sortByUrgency, lateness, CLOSED } from './mockData';
import { TaskRow, Count } from './MockBits';
import Icon from '../components/ui/Icon';

// קיבוץ לפי מצב. "באיחור" היא קבוצה בפני עצמה ותמיד ראשונה.
function group(t) {
  if (lateness(t)) return 'late';
  if (CLOSED.includes(t.status)) return 'done';
  if (t.status === 'blocked') return 'blocked';
  if (['in_progress', 'paused'].includes(t.status)) return 'working';
  return 'waiting';
}

const ORDER = ['late', 'working', 'waiting', 'blocked', 'done'];

// חלופה 2 — קבוצות מתקפלות, כל משימה שורת כותרת דחוסה שנפתחת לתצוגה מקדימה.
export default function BoardGrouped() {
  const [open, setOpen] = useState({ late: true, working: true, waiting: true });
  const [row, setRow] = useState(null);

  const groups = { late: [], working: [], waiting: [], blocked: [], done: [] };
  MOCK_TASKS.forEach((t) => groups[group(t)].push(t));

  return (
    <section className="rounded-2xl border border-line bg-slate-50/60 p-3 sm:p-4">
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h3 className="text-sm font-black text-slate-500">{mk.board.areaTitle}</h3>
        <span className="text-xs text-slate-400">{mk.board.expandHint}</span>
      </div>

      <div className="space-y-3">
        {ORDER.map((key) => {
          const list = sortByUrgency(groups[key]);
          const isOpen = !!open[key];
          const isLate = key === 'late';

          return (
            <div
              key={key}
              className={`overflow-hidden rounded-xl border bg-white ${
                isLate && list.length ? 'border-statusRed/40' : 'border-line'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                className={`flex min-h-touch w-full items-center gap-2 px-3 text-start ${
                  isLate && list.length ? 'bg-red-50' : 'bg-slate-50'
                }`}
              >
                <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="sm" className="text-slate-400" />
                <span
                  className={`text-sm font-bold ${
                    isLate && list.length ? 'text-urgentInk' : 'text-slate-900'
                  }`}
                >
                  {mk.board.groups[key]}
                </span>
                <Count n={list.length} />
              </button>

              {isOpen && (
                <div>
                  {list.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-400">{mk.board.empty}</p>
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
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
