import { Link } from 'react-router-dom';
import { he } from '../../locales/he';

// רשימת לקוחות — כרטיס לכל לקוח, לחיצה נכנסת לפרויקטים שלו
export default function ClientList({ clients }) {
  if (clients.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-lg text-slate-500 shadow-sm">
        {he.clients.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {clients.map((c) => (
        <li key={c.id}>
          <Link
            to={`/clients/${c.id}`}
            className="block rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="text-lg font-bold text-slate-900">{c.name}</div>
            <div className="mt-1 text-slate-500">
              {[c.contact_name, c.contact_phone].filter(Boolean).join(' · ') ||
                he.common.none}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
