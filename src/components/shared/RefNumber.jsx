// מספר קריא של לקוח / פרויקט / משימה — ‎#1001.
// dir="ltr" כדי שה-# יישאר בתחילת המספר גם בתוך משפט בעברית.
export default function RefNumber({ value, className = '' }) {
  if (value === null || value === undefined) return null;
  return (
    <span dir="ltr" className={`tabular-nums text-slate-400 ${className}`}>
      #{value}
    </span>
  );
}
