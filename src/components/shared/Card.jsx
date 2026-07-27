// כרטיס מרכזי — עיטוף עקבי למסכי אימות/הקמה (עיצוב 2026: פינות מעוגלות, צל עדין)
export default function Card({ title, subtitle, children }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
      {title && (
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      )}
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
