import { Outlet, Link, NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { he } from '../locales/he';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-base font-medium ${
    isActive ? 'bg-brand/10 text-brand' : 'text-slate-600 hover:bg-slate-100'
  }`;

// מעטפת האפליקציה למשתמש מחובר: כותרת עליונה קבועה + תוכן המסך.
export default function AppLayout() {
  const { member } = useOrg();

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/clients" className="flex items-center">
              <img
                src="/brand/tasko-header-light.png"
                alt={he.app.name}
                className="h-7 w-auto"
              />
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/my" className={navClass}>
                {he.nav.myTasks}
              </NavLink>
              <NavLink to="/clients" className={navClass}>
                {he.nav.clients}
              </NavLink>
            </nav>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-100"
          >
            {he.common.logout}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
