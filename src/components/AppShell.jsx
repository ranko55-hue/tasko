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

// מעטפת אחידה לכל המערכת: פס navy קבוע (זהות המערכת) + PageShell אחיד.
// אותו פס בכל מסך ובכל רוחב — דסקטופ פרוש, מובייל מגירה.
export default function AppShell() {
  const { member } = useOrg();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false); // מובייל: החיפוש הפרוש מפנה מקום
  // לעובד/ראש צוות: לוגו, שם, התנתקות בלבד. בלי ניווט ניהולי, חיפוש או פעולות.
  const manager = isManager(member);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
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

          {/* ניווט, חיפוש וזהות — בצד ימין (תחילת ה-RTL) */}
          <div className={`flex min-w-0 items-center gap-3 ${searchOpen ? 'flex-1' : ''}`}>
            {manager && (
              <>
                <div className="hidden md:block">
                  <NavLinks dark />
                </div>
                <div className={`min-w-0 md:w-64 lg:w-80 ${searchOpen ? 'flex-1' : ''}`}>
                  <SearchBar onExpandedChange={setSearchOpen} />
                </div>
              </>
            )}

            <span className={`max-w-[7rem] truncate text-sm text-slate-300 sm:max-w-none ${searchOpen ? 'hidden sm:inline' : ''}`}>
              {member?.full_name}
            </span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="min-h-touch shrink-0 rounded-lg px-3 text-sm font-medium text-slate-300 hover:bg-white/10"
            >
              {he.common.logout}
            </button>
          </div>

          {/* 4) לוגו TASKO — קצה שמאל של הפס. קובץ dark על רקע navy, גובה בלבד. */}
          <Link
            to={homePathFor(member)}
            className={`ms-auto min-h-touch shrink-0 items-center ${searchOpen ? 'hidden md:flex' : 'flex'}`}
            aria-label={he.app.name}
          >
            <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
          </Link>
        </div>
      </header>

      {manager && drawer && <MobileDrawer onClose={() => setDrawer(false)} />}

      <PageShell>
        <Outlet />
      </PageShell>
    </div>
  );
}
