import Icon from './Icon';

// מצב ריק — אייקון גרפי + משפט חם + פעולה מוצעת. אף פעם לא לבן ריק (DESIGN §5).
export default function EmptyState({ icon = 'inbox', message, action }) {
  return (
    <div className="py-8 text-center">
      <div className="flex justify-center text-slate-300">
        <Icon name={icon} size="xl" />
      </div>
      <p className="mt-3 text-lg text-slate-500">{message}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
