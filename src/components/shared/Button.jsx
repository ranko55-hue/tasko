export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = true,
  onClick,
  className = '',
  ...rest
}) {
  const base =
    'rounded-xl font-bold transition-colors focus:outline-none ' +
    'focus:ring-4 focus:ring-brand/30 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'min-h-touch px-3 text-sm',
    md: 'min-h-touch px-5 text-lg',
    lg: 'min-h-[64px] px-5 text-2xl',
  };

  const variants = {
    primary: 'bg-brand text-white hover:bg-brand-dark active:bg-brand-dark',
    secondary: 'border-2 border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100',
    ghost: 'bg-transparent text-brand hover:bg-brand/10',
    ghostDanger: 'bg-transparent text-red-600 hover:bg-red-50',
    outline: 'border-2 border-brand bg-white text-brand hover:bg-brand/5',
    danger: 'border-2 border-red-300 bg-white text-red-600 hover:bg-red-50',
    yellow: 'bg-brandYellow text-navy hover:bg-brandYellow/90',
    success: 'bg-green-600 text-white hover:bg-green-700',
    warning: 'bg-amber-500 text-white hover:bg-amber-600',
    warningOutline: 'border-2 border-amber-400 text-amber-700 hover:bg-amber-50',
    dark: 'bg-navy text-white hover:bg-navy2',
    link: 'bg-transparent text-brand hover:underline',
    dashed:
      'border-2 border-dashed border-slate-300 text-slate-600 ' +
      'hover:border-brand hover:text-brand',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size] ?? sizes.md} ${variants[variant] ?? variants.primary} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
