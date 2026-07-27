// לשוניות פנימיות בסגנון כרטיס הלקוח — מחליפות תוכן, לא מנווטות.
// הפעילה מודגשת בצהוב (DESIGN §2). tabs: [{ key, label }].
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line px-2">
      {tabs.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={
              'min-h-touch whitespace-nowrap border-b-2 px-4 text-base font-bold transition-colors ' +
              (on
                ? 'border-brandYellow text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600')
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
