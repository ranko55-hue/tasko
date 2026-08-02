// שדה טופס אחיד — תווית, קלט, שגיאה.
// תמיכה: input (ברירת מחדל), textarea, select. העבירו options לתמונת בחירה.
const INPUT =
  'w-full min-h-touch rounded-xl border border-line bg-white px-4 text-lg ' +
  'text-navy placeholder:text-grayLight focus:border-brand focus:outline-none ' +
  'focus:ring-4 focus:ring-brand/20';

export default function Field({
  label,
  error,
  children,
  value,
  onChange,
  type = 'text',
  as = 'input',
  placeholder,
  options,
  inputMode,
  autoComplete,
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-base font-medium text-inkSoft">
          {label}
        </span>
      )}
      {children ?? (
        <>
          {as === 'textarea' && (
            <textarea
              className={INPUT + ' min-h-[120px]'}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
            />
          )}
          {as === 'select' && (
            <select
              className={INPUT}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
            >
              {options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
          {as === 'input' && (
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
        </>
      )}
      {error && (
        <span className="mt-1 block text-sm font-medium text-danger">{error}</span>
      )}
    </label>
  );
}
