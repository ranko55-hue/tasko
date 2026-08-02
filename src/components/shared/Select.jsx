// תיבת בחירה — גובה 48px+, טקסט גדול (אנשי שטח)
export default function Select({ label, value, onChange, children, disabled = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-base font-medium text-inkSoft">
        {label}
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-touch rounded-xl border border-lineDark bg-white px-4
                   text-lg text-navy focus:border-brand focus:outline-none
                   focus:ring-4 focus:ring-brand/20
                   disabled:bg-appBg disabled:text-grayLight"
      >
        {children}
      </select>
    </label>
  );
}
