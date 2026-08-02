import { NavLink } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { isManager, isAdmin } from '../../lib/roles';
import { he } from '../../locales/he';


// סרגל ניווט: admin=7+, manager=5 (בלי צוות ודוחות), worker=null.
// vertical=מגירת מובייל. dark=פס navy. onNavigate סוגר את המגירה בלחיצה.
export default function NavLinks({ dark = false, vertical = false, onNavigate }) {
  const { member, isPlatformAdmin } = useOrg();
  const manager = isManager(member);
  const admin = isAdmin(member);

  if (!manager) return null;

  const base =
    'flex items-center min-h-touch px-3 text-sm font-bold transition-colors whitespace-nowrap ' +
    (vertical ? 'w-full justify-start rounded-lg' : 'border-b-2 border-transparent');

  const cls = ({ isActive }) => {
    if (dark) {
      return `${base} ${
        isActive
          ? 'border-b-brandYellow text-white'
          : 'text-slate-300 hover:text-white border-b-transparent'
      }`;
    }
    return `${base} ${
      isActive
        ? 'border-b-brandYellow text-brand'
        : 'text-slate-600 hover:text-slate-900 border-b-transparent'
    }`;
  };

  const link = (to, label) => (
    <NavLink to={to} className={cls} onClick={onNavigate}>
      {label}
    </NavLink>
  );

  return (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-0'}>
      {link('/dashboard', he.nav.dashboard)}
      {link('/tasks', he.nav.tasks)}
      {link('/clients', he.nav.clients)}
      {link('/projects', he.nav.projects)}
      {admin && link('/team', he.nav.team)}
      {admin && link('/reports', he.nav.reports)}
      {link('/settings', he.nav.settings)}
      {isPlatformAdmin && link('/platform/tickets', he.platform.nav)}
    </nav>
  );
}
