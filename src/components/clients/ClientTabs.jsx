import { he } from '../../locales/he';

const TABS = ['general', 'tasks', 'projects', 'finance'];

// שורת לשוניות פנימיות — מחליפות תוכן, לא מנווטות. הפעילה מודגשת בצהוב (DESIGN §2).
export default function ClientTabs({ active, onChange }) {
  const t = he.clientDetail.tabs;
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line px-2">
      {TABS.map((key) => {
        const on = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={
              'min-h-touch whitespace-nowrap border-b-2 px-4 text-base font-bold transition-colors ' +
              (on
                ? 'border-brandYellow text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600')
            }
          >
            {t[key]}
          </button>
        );
      })}
    </div>
  );
}
