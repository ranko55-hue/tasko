// תגית צבועה (סטטוס / עדיפות)
export default function Badge({ label, className = '' }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${className}`}
    >
      {label}
    </span>
  );
}
