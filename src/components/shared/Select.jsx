// תיבת בחירה — גובה 48px+, טקסט גדול (אנשי שטח)
export default function Select({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-touch rounded-xl border border-slate-300 bg-white px-4
                   text-lg text-slate-900 focus:border-brand focus:outline-none
                   focus:ring-4 focus:ring-brand/20"
      >
        {children}
      </select>
    </label>
  );
}
