import { Link } from 'react-router-dom';
import { he } from '../../locales/he';
import Badge from '../shared/Badge';

// רשימת פרויקטים של לקוח — לחיצה נכנסת למשימות הפרויקט
export default function ProjectList({ projects }) {
  if (projects.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-lg text-slate-500 shadow-sm">
        {he.projects.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {projects.map((p) => (
        <li key={p.id}>
          <Link
            to={`/projects/${p.id}`}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="text-lg font-bold text-slate-900">{p.name}</div>
              {p.address && (
                <div className="mt-1 text-slate-500">{p.address}</div>
              )}
            </div>
            <Badge
              label={he.projects.status[p.status] ?? p.status}
              className={
                p.status === 'open'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-500'
              }
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
