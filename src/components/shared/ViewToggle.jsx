import { he } from '../../locales/he';

const d = he.dashboard;

// מתג תצוגת הלוח — משמש גם על הלוח וגם במסך ההגדרות, כדי ששני המקומות
// ייראו ויתנהגו זהה ולא יתפצלו עם הזמן.
export default function ViewToggle({ view, onChange, size = 'md' }) {
  const base = 'rounded-lg px-3 font-bold transition-colors';
  const h = size === 'lg' ? 'min-h-touch text-base' : 'min-h-touch text-sm';

  const btn = (key, label) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={view === key}
      className={`${base} ${h} ${
        view === key ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-white p-1 ring-1 ring-line">
      {btn('columns', d.viewColumns)}
      {btn('rows', d.viewRows)}
    </div>
  );
}
