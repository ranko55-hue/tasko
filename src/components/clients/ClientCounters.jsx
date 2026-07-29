import { he } from '../../locales/he';

const t = he.clients.table;

// צבע למונה העיכוב — נצבע רק כשהוא גדול מ-0, ברוח צ'יפי התדריך.
// 1-2 = כתום, 3+ = אדום. אפס נשאר אפור ולא מושך תשומת לב.
export function delayTone(n) {
  if (!n) return 'text-slate-400';
  return n >= 3 ? 'text-statusRed' : 'text-amber-600';
}

const NUM = 'tabular-nums font-bold';

// המונים — משמשים גם בשורת הטבלה (דסקטופ) וגם בכרטיס (390)
export default function ClientCounters({ row, layout = 'row' }) {
  const waiting = row.waiting_tasks ?? 0;
  const delayed = row.delayed_tasks ?? 0;

  if (layout === 'card') {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
        <span>
          {t.projects}: <span className={NUM}>{row.active_projects ?? 0}</span>
        </span>
        <span>
          {t.openTasks}: <span className={NUM}>{row.open_tasks ?? 0}</span>
        </span>
        <span>
          {t.waitingLabel}: <span className={NUM}>{waiting}</span>
        </span>
        <span>
          {t.delayedLabel}: <span className={`${NUM} ${delayTone(delayed)}`}>{delayed}</span>
        </span>
      </div>
    );
  }

  return null;
}

// תא "ממתינות / בעיכוב" בטבלה — שתי ספרות, רק העיכוב נצבע
export function WaitingDelayedCell({ row }) {
  const waiting = row.waiting_tasks ?? 0;
  const delayed = row.delayed_tasks ?? 0;
  return (
    <span className="whitespace-nowrap">
      <span className={`${NUM} text-slate-700`}>{waiting}</span>
      <span className="mx-1 text-slate-300">/</span>
      <span className={`${NUM} ${delayTone(delayed)}`}>{delayed}</span>
    </span>
  );
}
