// הכרטיס הלבן הסטנדרטי — עיגול, מסגרת line, צל רך.
// ללא ריפוד מובנה (יש כרטיסים עם כותרת/לשוניות בקצה) — הצרכן מוסיף p-4.
export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
