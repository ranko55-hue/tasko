import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { isManager, homePathFor } from '../lib/roles';
import { he } from '../locales/he';
import NavLinks from './shared/NavLinks';
import SearchBar from './shell/SearchBar';
import MobileDrawer from './shell/MobileDrawer';
import PageShell from './ui/PageShell';

// מעטפת אחידה: הדר דו-שורתי — שורה 1 זהות, שורה 2 ניווט+חיפוש.
// עובד/ראש צוות רואים רק שורה 1 (לוגו+שם+התנתקות).
export default function AppShell() {
  const { member } = useOrg();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const manager = isManager(member);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 bg-navy text-white">
        {/* שורה 1 — זהות: שם+התנתקות בצד ימין, לוגו בצד שמאל */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          {manager && (
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label={he.shell.menu}
              className="min-h-touch rounded-lg px-2 text-2xl leading-none text-slate-200 hover:bg-white/10 md:hidden"
            >
              ☰
            </button>
          )}

          <Link
            to={`/team/${member?.id}`}
            className="max-w-[7rem] truncate text-sm text-slate-300 hover:text-white sm:max-w-none"
          >
            {member?.full_name}
          </Link>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="min-h-touch shrink-0 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10"
          >
            {he.common.logout}
          </button>

          <Link
            to={homePathFor(member)}
            className="ms-auto flex min-h-touch shrink-0 items-center"
            aria-label={he.app.name}
          >
            <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
          </Link>
        </div>

        {/* שורה 2 — ניווט + חיפוש (מנהלים בלבד, דסקטופ) */}
        {manager && (
          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4">
              <div className="hidden flex-1 overflow-x-auto md:block">
                <NavLinks dark />
              </div>
              <div className={`min-w-0 md:w-64 lg:w-80 ${searchOpen ? 'flex-1' : ''}`}>
                <SearchBar onExpandedChange={setSearchOpen} />
              </div>
            </div>
          </div>
        )}

      </header>

      {manager && drawer && <MobileDrawer onClose={() => setDrawer(false)} />}

      <PageShell>
        <Outlet />
      </PageShell>
    </div>
  );
}
