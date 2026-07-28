import { NavLink } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { isManager } from '../../lib/roles';
import { he } from '../../locales/he';


// סרגל ניווט משותף: לוח · לקוחות · פרויקטים · הגדרות (פעיל = קו תחתון צהוב)
// vertical=מגירת מובייל. dark=פס navy. onNavigate נסגר את המגירה בלחיצה.
export default function NavLinks({ dark = false, vertical = false, onNavigate }) {
  const { member } = useOrg();
  const manager = isManager(member);

  const base =
    'flex items-center min-h-touch px-3 text-base font-bold transition-colors ' +
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

  if (!manager) return null;

  return (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-0'}>
      {link('/dashboard', he.nav.dashboard)}
      {link('/clients', he.nav.clients)}
      {link('/settings', he.nav.settings)}
    </nav>
  );
}
