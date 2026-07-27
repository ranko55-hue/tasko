// שדה טקסט עם תווית — גובה 48px+, טקסט גדול וקריא
export default function TextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-base font-medium text-slate-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full min-h-touch rounded-xl border border-slate-300 bg-white px-4
                   text-lg text-slate-900 placeholder:text-slate-400
                   focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
      />
    </label>
  );
}
