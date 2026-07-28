// שורת הגדרה מסוג תיבת סימון. מבנה גנרי — סעיפים נוספים ייכנסו כאן בלי שינוי מבנה.
export default function SettingRow({ label, hint, checked, onChange, disabled = false }) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border border-line p-4 ${
        disabled ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-brand
                   focus:ring-2 focus:ring-brand/30"
      />
      <span className="min-w-0">
        <span className="block font-bold text-slate-900">{label}</span>
        {hint && <span className="mt-1 block text-sm text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}
