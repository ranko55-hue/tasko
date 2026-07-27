import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { he } from '../locales/he';
import NavLinks from './shared/NavLinks';
import SearchBar from './shell/SearchBar';
import QuickActions from './shell/QuickActions';
import MobileDrawer from './shell/MobileDrawer';
import PageShell from './ui/PageShell';

// מעטפת אחידה לכל המערכת: פס navy קבוע (זהות המערכת) + PageShell אחיד.
// אותו פס בכל מסך ובכל רוחב — דסקטופ פרוש, מובייל מגירה.
export default function AppShell() {
  const { member } = useOrg();
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={he.shell.menu}
            className="min-h-touch rounded-lg px-2 text-2xl leading-none text-slate-200 hover:bg-white/10 md:hidden"
          >
            ☰
          </button>

          <Link to="/dashboard" className="flex items-center">
            <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
          </Link>

          <div className="hidden md:block">
            <NavLinks dark />
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <SearchBar />
          </div>
          <div className="hidden md:block">
            <QuickActions />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <span className="hidden text-sm text-slate-300 lg:inline">
              {member?.full_name}
            </span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="hidden min-h-touch rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10 md:block"
            >
              {he.common.logout}
            </button>
          </div>
        </div>

        {/* מובייל: שורת חיפוש מלאת-רוחב (אותה פעולה, צפיפות שונה) */}
        <div className="px-4 pb-3 md:hidden">
          <SearchBar onNavigate={() => setDrawer(false)} />
        </div>
      </header>

      {drawer && <MobileDrawer onClose={() => setDrawer(false)} />}

      <PageShell>
        <Outlet />
      </PageShell>
    </div>
  );
}
