import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useOrg } from '../lib/orgContext';
import { isManager, homePathFor } from '../lib/roles';
import { he } from '../locales/he';
import { readBool, writeBool } from '../lib/storage';
import Button from './shared/Button';
import Sidebar from './shell/Sidebar';
import Topbar from './shell/Topbar';
import PageShell from './ui/PageShell';
import SupportModal from './support/SupportModal';

const SIDEBAR_COLLAPSED_KEY = 'shell.sidebarCollapsed';

// מעטפת אחידה עם ניווט צדי (sidebar) בצד ימין + פס עליון בהשראת CRM.
// מנהל: sidebar + פס מלא. עובד: פס פשוט בלבד (אין לו ניווט).
export default function AppShell() {
  const { member } = useOrg();
  const manager = isManager(member);
  const [collapsed, setCollapsed] = useState(() => readBool(SIDEBAR_COLLAPSED_KEY));
  const [mobileNav, setMobileNav] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((v) => {
      writeBool(SIDEBAR_COLLAPSED_KEY, !v);
      return !v;
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-appBg">
      {manager ? (
        <Topbar onMenu={() => setMobileNav(true)} />
      ) : (
        <header className="sticky top-0 z-40 h-[68px] shrink-0 bg-navy text-white">
          <div className="flex h-full items-center gap-2 px-4">
            <div className="flex min-w-0 items-center gap-1">
              <Link to={`/team/${member?.id}`} className="max-w-24 truncate text-sm text-lineDark hover:text-white sm:max-w-none">
                {member?.full_name}
              </Link>
              <Button variant="ghost" size="sm" fullWidth={false} className="shrink-0 text-lineDark hover:bg-white/10 hover:text-white" onClick={() => setSupportOpen(true)}>
                {he.support.trigger}
              </Button>
              <Button variant="ghost" size="sm" fullWidth={false} className="shrink-0 text-lineDark hover:bg-white/10 hover:text-white" onClick={() => supabase.auth.signOut()}>
                {he.common.logout}
              </Button>
            </div>
            <Link to={homePathFor(member)} className="ms-auto flex items-center" aria-label={he.app.name}>
              <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
            </Link>
          </div>
        </header>
      )}

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
