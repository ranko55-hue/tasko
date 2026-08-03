import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/orgContext';
import { isAdmin } from '../../lib/roles';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';
import Button from '../shared/Button';
import TopbarActions from './TopbarActions';

const s = he.sidebar;

// רשימת פריטי הניווט + התפקיד הנדרש — אותה הרשאה כמו הניתוב ב-App.jsx.
// "צוות"/"דוחות" למנהל מערכת, "תמיכה"/"ארגונים" למנהל פלטפורמה.
function useNavItems() {
  const { member, isPlatformAdmin } = useOrg();
  const admin = isAdmin(member);
  return [
    { to: '/dashboard', label: he.nav.dashboard, icon: 'grid', show: true },
    { to: '/clients', label: he.nav.clients, icon: 'client', show: true },
    { to: '/projects', label: he.nav.projects, icon: 'project', show: true },
    { to: '/tasks', label: he.nav.tasks, icon: 'task', show: true },
    { to: '/team', label: he.nav.team, icon: 'users', show: admin },
    { to: '/reports', label: he.nav.reports, icon: 'report', show: admin },
    { to: '/settings', label: he.nav.settings, icon: 'settings', show: true },
    { to: '/platform/tickets', label: he.platform.nav, icon: 'support', show: isPlatformAdmin },
    { to: '/platform/orgs', label: he.platform.navOrgs, icon: 'org', show: isPlatformAdmin },
  ].filter((i) => i.show);
}

// פריט ניווט אמיתי — NavLink, פעיל מודגש. collapsed → אייקון + tooltip.
function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `flex min-h-touch items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${
          collapsed ? 'justify-center' : 'justify-start'
        } ${isActive ? 'bg-brandYellow text-navy' : 'text-lineDark hover:bg-white/10 hover:text-white'}`
      }
    >
      <Icon name={item.icon} size="md" className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function SidebarNav({ collapsed, onNavigate }) {
  const items = useNavItems();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

// ניווט צדי בצד ימין (RTL). דסקטופ: נמתח לגובה מלא, רוחב לפי collapsed.
// מובייל: מוסתר, נפתח כשכבה מעל התוכן ונסגר בבחירת פריט או בלחיצה מחוץ.
export default function Sidebar({ width, collapsed, onToggle, mobileOpen, onCloseMobile, onSupport }) {
  const { member } = useOrg();

  return (
    <>
      {/* דסקטופ — גובה מלא: כפתור קיפול, ניווט, ובתחתית פנייה לתמיכה.
          רוחב מהמשתנה היחיד (מזין גם את יישור הפס). */}
      <aside
        style={{ width }}
        className="hidden shrink-0 bg-navy text-white transition-all duration-200 md:block"
      >
        <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col gap-2 p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? s.expand : s.collapse}
            title={collapsed ? s.expand : s.collapse}
            className={`mb-1 flex min-h-touch items-center gap-2 rounded-xl px-3 text-lineDark transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <Icon name="menu" size="md" className="shrink-0" />
            {!collapsed && <span className="text-sm font-bold">{s.collapse}</span>}
          </button>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={collapsed} />
          </div>
          <button
            type="button"
            onClick={onSupport}
            aria-label={he.support.trigger}
            title={collapsed ? he.support.trigger : undefined}
            className={`flex min-h-touch items-center gap-3 rounded-xl border-t border-white/10 px-3 pt-3 text-sm font-bold text-lineDark transition-colors hover:bg-white/10 hover:text-white ${
              collapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <Icon name="support" size="md" className="shrink-0" />
            {!collapsed && <span className="truncate">{he.support.trigger}</span>}
          </button>
        </div>
      </aside>

      {/* מובייל — מגירה */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-navy text-white shadow-xl">
            <div className="flex items-center justify-between p-3">
              <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label={s.close}
                className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-lineDark hover:bg-white/10 hover:text-white"
              >
                <Icon name="close" size="md" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3">
              <SidebarNav collapsed={false} onNavigate={onCloseMobile} />
            </div>

            {/* פוטר — פעולות מהירות + משתמש + תמיכה + יציאה */}
            <div className="border-t border-white/10 p-3">
              <TopbarActions onDone={onCloseMobile} />
              <div className="my-3 border-t border-white/10" />
              <div className="mb-2 truncate text-sm text-lineDark">{member?.full_name}</div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start text-white hover:bg-white/10" onClick={onSupport}>
                  {he.support.trigger}
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-white hover:bg-white/10" onClick={() => supabase.auth.signOut()}>
                  {he.common.logout}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
