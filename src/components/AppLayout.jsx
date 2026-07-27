import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { he } from '../locales/he';

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
          <Link to="/clients" className="text-2xl font-extrabold tracking-tight text-brand">
            {he.app.name}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-slate-500 sm:inline">
              {member?.full_name}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-base font-medium text-slate-600 hover:bg-slate-100"
            >
              {he.common.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
