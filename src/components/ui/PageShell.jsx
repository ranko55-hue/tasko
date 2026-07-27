// מיכל עמוד אחיד — רוחב מקסימלי אחיד, ריפוד אחיד, רקע bg (#F1F5F9).
// כל עמוד עוטף את תוכנו ב-PageShell.
export default function PageShell({ children }) {
  return (
    <div className="min-h-full bg-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
