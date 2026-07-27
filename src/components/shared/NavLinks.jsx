import { NavLink } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';

const MANAGER_ROLES = ['project_manager', 'work_manager'];

// סרגל ניווט משותף (role-gated). מנהל: לוח / משימות / לקוחות. עובד: משימות בלבד.
// כפתורים בגובה 48px+ (חוקת הכפתורים). variant בהיר/כהה לפי הכותרת.
export default function NavLinks({ dark = false }) {
  const { member } = useOrg();
  const isManager = MANAGER_ROLES.includes(member?.role);

  const base =
    'flex items-center min-h-touch rounded-lg px-3 text-base font-bold';
  const cls = ({ isActive }) =>
    dark
      ? `${base} ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`
      : `${base} ${isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <nav className="flex items-center gap-1">
      {isManager && (
        <NavLink to="/dashboard" className={cls}>
          {he.nav.dashboard}
        </NavLink>
      )}
      <NavLink to="/my" className={cls}>
        {he.nav.myTasks}
      </NavLink>
      {isManager && (
        <NavLink to="/clients" className={cls}>
          {he.nav.clients}
        </NavLink>
      )}
    </nav>
  );
}
