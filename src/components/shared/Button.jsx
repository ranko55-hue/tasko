// כפתור ראשי — גובה מינימלי 48px (עקרונות עיצוב: אנשי שטח)
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  disabled = false,
  onClick,
}) {
  const base =
    'w-full min-h-touch rounded-xl px-5 text-lg font-bold transition-colors ' +
    'focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:opacity-50 ' +
    'disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark',
    ghost: 'bg-transparent text-brand hover:bg-brand/10',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
