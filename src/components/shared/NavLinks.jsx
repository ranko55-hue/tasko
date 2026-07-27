import { NavLink } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';

const MANAGER_ROLES = ['project_manager', 'work_manager'];

// סרגל ניווט משותף (role-gated). מנהל: לוח/משימות/לקוחות. עובד: משימות בלבד.
// vertical=מגירת מובייל. dark=פס navy. onNavigate נסגר את המגירה בלחיצה.
export default function NavLinks({ dark = false, vertical = false, onNavigate }) {
  const { member } = useOrg();
  const isManager = MANAGER_ROLES.includes(member?.role);

  const base =
    'flex items-center min-h-touch rounded-lg px-3 text-base font-bold ' +
    (vertical ? 'w-full justify-start' : '');
  const cls = ({ isActive }) =>
    dark
      ? `${base} ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10'}`
      : `${base} ${isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-100'}`;

  const link = (to, label) => (
    <NavLink to={to} className={cls} onClick={onNavigate}>
      {label}
    </NavLink>
  );

  return (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-1'}>
      {isManager && link('/dashboard', he.nav.dashboard)}
      {link('/my', he.nav.myTasks)}
      {isManager && link('/clients', he.nav.clients)}
    </nav>
  );
}
