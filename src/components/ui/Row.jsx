// שורת המערכת — אייקון + תוכן ראשי + תוכן משני + תג בקצה, לחיצה אופציונלית.
// זו השורה של כל המערכת: משימות, פרויקטים, מסמכים, לקוחות, עובדים.
// אין טבלאות — במסך צר כל "טבלה" היא רשימת Row.
export default function Row({ icon, title, subtitle, trailing, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={
        'flex min-h-touch w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-right ' +
        (onClick ? 'transition-colors hover:bg-surface' : '')
      }
    >
      {icon && <span className="shrink-0 text-xl">{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-navy">{title}</div>
        {subtitle && (
          <div className="truncate text-sm text-grayMid">{subtitle}</div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </Tag>
  );
}
