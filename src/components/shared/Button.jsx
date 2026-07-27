// כפתור — חוקת הכפתורים: ראשי ענק (lg=64px), משני 48px+. שום דבר מתחת 48px.
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
}) {
  const base =
    'w-full rounded-xl px-5 font-bold transition-colors focus:outline-none ' +
    'focus:ring-4 focus:ring-brand/30 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    md: 'min-h-touch text-lg',
    lg: 'min-h-[64px] text-2xl',
  };

  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark',
    ghost: 'bg-transparent text-brand hover:bg-brand/10',
    outline: 'border-2 border-brand bg-white text-brand hover:bg-brand/5',
    danger: 'border-2 border-red-500 bg-white text-red-600 hover:bg-red-50',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
