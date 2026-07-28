import { NavLink } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';

const MANAGER_ROLES = ['project_manager', 'work_manager'];

// סרגל ניווט משותף: לוח · לקוחות · פרויקטים · הגדרות (פעיל = קו תחתון צהוב)
// vertical=מגירת מובייל. dark=פס navy. onNavigate נסגר את המגירה בלחיצה.
export default function NavLinks({ dark = false, vertical = false, onNavigate }) {
  const { member } = useOrg();
  const isManager = MANAGER_ROLES.includes(member?.role);

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

  if (!isManager) return null;

  return (
    <nav className={vertical ? 'flex flex-col gap-1' : 'flex items-center gap-0'}>
      {link('/dashboard', 'לוח')}
      {link('/clients', 'לקוחות')}
    </nav>
  );
}
