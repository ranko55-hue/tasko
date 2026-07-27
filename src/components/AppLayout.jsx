import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import NavLinks from './shared/NavLinks';

// מעטפת האפליקציה למשתמש מחובר: כותרת עליונה קבועה + תוכן המסך.
export default function AppLayout() {
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
            <NavLinks />
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

      {/* התוכן — כל עמוד עוטף את עצמו ב-PageShell (רוחב/ריפוד אחיד) */}
      <Outlet />
    </div>
  );
}
