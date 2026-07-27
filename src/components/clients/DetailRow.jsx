// שורה משותפת אחת — משמשת בזהות בלשוניות משימות / פרויקטים / כספים.
// אייקון + כותרת + כתובת-משנה, ותג צבעוני בקצה. לחיצה (אם onClick) פותחת.
export default function DetailRow({ icon, title, subtitle, tagLabel, tagClass = '', onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={
        'flex min-h-touch w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-right ' +
        (onClick ? 'transition-colors hover:bg-slate-50' : '')
      }
    >
      <span className="shrink-0 text-xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-slate-900">{title}</div>
        {subtitle && <div className="truncate text-sm text-slate-500">{subtitle}</div>}
      </div>
      {tagLabel && (
        <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${tagClass}`}>
          {tagLabel}
        </span>
      )}
    </Tag>
  );
}
