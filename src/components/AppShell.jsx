import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { isManager, homePathFor } from '../lib/roles';
import { he } from '../locales/he';
import { readBool, writeBool } from '../lib/storage';
import Button from './shared/Button';
import Sidebar from './shell/Sidebar';
import SearchBar from './shell/SearchBar';
import PageShell from './ui/PageShell';
import SupportModal from './support/SupportModal';
import Icon from './ui/Icon';

const SIDEBAR_COLLAPSED_KEY = 'shell.sidebarCollapsed';

// מעטפת אחידה עם ניווט צדי (sidebar) בצד ימין.
// מנהל: sidebar + פס עליון נקי. עובד: פס עליון בלבד (אין לו ניווט).
export default function AppShell() {
  const { member } = useOrg();
  const manager = isManager(member);
  const [collapsed, setCollapsed] = useState(() => readBool(SIDEBAR_COLLAPSED_KEY));
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((v) => {
      writeBool(SIDEBAR_COLLAPSED_KEY, !v);
      return !v;
    });
  }

  const userLinks = (
    <>
      <Link
        to={`/team/${member?.id}`}
        className="max-w-24 truncate text-sm text-lineDark hover:text-white sm:max-w-none"
      >
        {member?.full_name}
      </Link>
      <Button variant="ghost" size="sm" fullWidth={false} className="shrink-0 text-lineDark hover:bg-white/10 hover:text-white" onClick={() => setSupportOpen(true)}>
        {he.support.trigger}
      </Button>
      <Button variant="ghost" size="sm" fullWidth={false} className="shrink-0 text-lineDark hover:bg-white/10 hover:text-white" onClick={() => supabase.auth.signOut()}>
        {he.common.logout}
      </Button>
    </>
  );

  const logo = (
    <Link to={homePathFor(member)} className="flex items-center" aria-label={he.app.name}>
      <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
    </Link>
  );

  return (
    <div className="flex min-h-screen flex-col bg-appBg">
      <header className="sticky top-0 z-40 h-14 shrink-0 bg-navy text-white">
        {manager ? (
          <div className={`grid h-full items-center gap-2 px-4 ${searchOpen ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto_1fr]'}`}>
            {/* צד ימין (RTL) — המבורגר (מובייל) + אזור המשתמש (דסקטופ) */}
            <div className="flex min-w-0 items-center gap-1 justify-self-start">
              <button
                type="button"
                onClick={() => setMobileNav(true)}
                aria-label={he.sidebar.menu}
                className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-line hover:bg-white/10 md:hidden"
              >
                <Icon name="menu" size="md" />
              </button>
              <div className="hidden min-w-0 items-center gap-1 md:flex">{userLinks}</div>
            </div>

            {/* מרכז — חיפוש */}
            <div className={`justify-self-center ${searchOpen ? 'w-full' : 'md:w-80'}`}>
              <SearchBar onExpandedChange={setSearchOpen} />
            </div>

            {/* צד שמאל (RTL) — לוגו */}
            <div className="justify-self-end">{logo}</div>
          </div>
        ) : (
          <div className="flex h-full items-center gap-2 px-4">
            <div className="flex min-w-0 items-center gap-1">{userLinks}</div>
            <div className="ms-auto">{logo}</div>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {manager && (
          <Sidebar
            collapsed={collapsed}
            onToggle={toggleCollapsed}
            mobileOpen={mobileNav}
            onCloseMobile={() => setMobileNav(false)}
            onSupport={() => {
              setMobileNav(false);
              setSupportOpen(true);
            }}
          />
        )}
        <main className="min-w-0 flex-1">
          <PageShell>
            <Outlet />
          </PageShell>
        </main>
      </div>

      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}
    </div>
  );
}
