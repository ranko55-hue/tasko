import { he } from '../../../locales/he';
import { formatDateTime } from '../../../lib/time';

const d = he.tasks.drawer;
const BASE = 'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold';
const NUM = { fontVariantNumeric: 'tabular-nums' };

// שורת צ'יפים — מציגה רק מה שקיים בפועל. צ'יפ ריק לא מוצג.
export default function TaskChips({ task }) {
  const chips = [];

  if (task?.priority === 'urgent') {
    chips.push({ key: 'urgent', cls: 'bg-urgentSoft text-urgentInk', label: d.chipUrgent });
  }
  if (task?.due_at) {
    chips.push({
      key: 'due',
      cls: 'bg-dueSoft text-dueInk',
      label: `${d.chipDue} ${formatDateTime(task.due_at)}`,
      num: true,
    });
  }
  if (task?.est_minutes) {
    chips.push({
      key: 'est',
      cls: 'bg-slate-100 text-slate-600',
      label: `${d.chipAllocated} ${task.est_minutes} ${he.time.minutes}`,
      num: true,
    });
  }
  if (task?.requirements?.length) {
    chips.push({
      key: 'req',
      cls: 'bg-reqSoft text-reqInk',
      label: `${d.chipRequirements} ${task.requirements.length}`,
      num: true,
    });
  }

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 sm:px-5">
      {chips.map((c) => (
        <span key={c.key} className={`${BASE} ${c.cls}`} style={c.num ? NUM : undefined}>
          {c.label}
        </span>
      ))}
    </div>
  );
}
