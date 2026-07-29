import { he } from '../../locales/he';

const d = he.dashboard;

// מתג תצוגת הלוח — משמש גם על הלוח וגם במסך ההגדרות.
//
// הפקד נראה קומפקטי (~32px) אבל אזור הלחיצה נשאר 44px: הכפתור עצמו בגובה
// מלא ונמשך פנימה ב-margin שלילי, והמראה יושב על ה-span הפנימי. כך העין
// רואה פקד נמוך והאצבע מקבלת מטרה מלאה.
export default function ViewToggle({ view, onChange }) {

  const btn = (key, label) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={view === key}
      className="-my-2 flex h-11 items-center"
    >
      <span
        className={`flex h-7 items-center rounded-md px-3 text-[13px] font-bold transition-colors ${
          view === key ? 'bg-navy text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-white p-0.5 ring-1 ring-line">
      {btn('columns', d.viewColumns)}
      {btn('rows', d.viewRows)}
    </div>
  );
}
