import { he } from '../../locales/he';
import Button from '../shared/Button';
import EmptyState from '../ui/EmptyState';
import RefNumber from '../shared/RefNumber';
import ClientCounters, { WaitingDelayedCell, delayTone } from './ClientCounters';

const t = he.clients.table;
const NUM = 'tabular-nums font-bold text-inkSoft';

// מסך הלקוחות: טבלה בדסקטופ, כרטיסים דחוסים ב-390.
// אין טבלה גולשת אופקית — במסך צר הטבלה מתחלפת ולא נגללת.
export default function ClientTable({ rows, onOpen, onNewTask }) {
  if (!rows.length) {
    return <EmptyState icon="users" message={he.clients.empty} />;
  }

  const contactOf = (r) =>
    [r.contact_name, r.contact_phone].filter(Boolean).join(' · ') || he.common.none;

  return (
    <>
      {/* ── 390: כרטיס דחוס — שם למעלה, מונים בשורה אחת מתחת ── */}
      <div className="space-y-3 md:hidden">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-line bg-white p-3">
            <button
              type="button"
              onClick={() => onOpen(r)}
              className="block w-full text-right"
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 truncate font-bold text-navy">{r.name}</span>
                <RefNumber value={r.number} className="shrink-0 text-sm" />
              </div>
              <div className="mt-1 truncate text-sm text-grayMid">{contactOf(r)}</div>
              <div className="mt-2">
                <ClientCounters row={r} layout="card" />
              </div>
            </button>
            <Button variant="yellow" className="mt-3" onClick={() => onNewTask(r)}>
              {t.newTask}
            </Button>
          </div>
        ))}
      </div>

      {/* ── דסקטופ: טבלה ── */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-white md:block">
        <table className="w-full text-right">
          <thead className="border-b border-line bg-surface text-sm text-grayMid">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">{t.name}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.contact}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.projects}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.openTasks}</th>
              <th scope="col" className="px-4 py-3 font-medium">{t.waitingDelayed}</th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onOpen(r)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-3 font-bold text-navy">
                  <span className="flex items-baseline gap-2">
                    <span className="min-w-0 truncate">{r.name}</span>
                    <RefNumber value={r.number} className="shrink-0 text-sm font-normal" />
                  </span>
                </td>
                <td className="px-4 py-3 text-grayDark">{contactOf(r)}</td>
                <td className={`px-4 py-3 ${NUM}`}>{r.active_projects ?? 0}</td>
                <td className={`px-4 py-3 ${NUM}`}>{r.open_tasks ?? 0}</td>
                <td className="px-4 py-3">
                  <WaitingDelayedCell row={r} />
                </td>
                <td className="px-4 py-3 text-left">
                  <Button
                    variant="yellow"
                    size="sm"
                    fullWidth={false}
                    className="whitespace-nowrap"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewTask(r);
                    }}
                  >
                    {t.newTask}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
