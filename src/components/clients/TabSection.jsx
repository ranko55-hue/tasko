// כותרת סעיף בתוך לשונית (למשל "משימות פתוחות (3)") + רשימת שורות.
export default function TabSection({ title, children }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold text-grayMid">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
