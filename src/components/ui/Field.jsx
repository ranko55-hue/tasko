// שדה טופס אחיד — תווית, קלט, שגיאה.
// ברירת מחדל: <input> סטנדרטי (onChange מחזיר ערך). ל-select/textarea: העבירו children.
const INPUT =
  'w-full min-h-touch rounded-xl border border-line bg-white px-4 text-lg ' +
  'text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none ' +
  'focus:ring-4 focus:ring-brand/20';

export default function Field({
  label,
  error,
  children,
  value,
  onChange,
  type = 'text',
  placeholder,
  inputMode,
  autoComplete,
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-base font-medium text-slate-700">
          {label}
        </span>
      )}
      {children ?? (
        <input
          className={INPUT}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
        />
      )}
      {error && (
        <span className="mt-1 block text-sm font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}
