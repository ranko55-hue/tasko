// כותרת עמוד אחידה — כותרת + שורת משנה אפורה + אזור פעולות מימין.
// מבנה זהה בכל מסך.
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-black text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-grayMid">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
