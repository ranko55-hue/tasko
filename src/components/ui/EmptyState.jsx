// מצב ריק — אימוג'י + משפט חם + פעולה מוצעת. אף פעם לא לבן ריק (DESIGN §5).
export default function EmptyState({ emoji = '📭', message, action }) {
  return (
    <div className="py-8 text-center">
      <div className="text-4xl">{emoji}</div>
      <p className="mt-3 text-lg text-slate-500">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
