import { NavLink } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/orgContext';
import { isAdmin } from '../../lib/roles';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';
import Button from '../shared/Button';
import TopbarActions from './TopbarActions';

const s = he.sidebar;

// סגנון פריט משותף — פריט ניווט, תמיכה, קיפול. מנוחה: טקסט תכלת-אפרפר;
// hover: רקע לבן שקוף עדין + טקסט לבן.
const ITEM =
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-sidebarText hover:bg-white/[0.07] hover:text-white';

// קבוצות הניווט + התפקיד הנדרש — אותה הרשאה כמו הניתוב ב-App.jsx.
// החלוקה לקבוצות היא ויזואלית בלבד; מי רואה מה נקבע ע"י show, ללא שינוי.
function useNavSections() {
  const { member, isPlatformAdmin } = useOrg();
  const admin = isAdmin(member);

  const main = [
    { to: '/dashboard', label: he.nav.dashboard, icon: 'grid' },
    { to: '/clients', label: he.nav.clients, icon: 'client' },
    { to: '/projects', label: he.nav.projects, icon: 'project' },
    { to: '/tasks', label: he.nav.tasks, icon: 'task' },
    { to: '/calendar', label: he.nav.calendar, icon: 'calendar' },
    { to: '/attendance', label: he.nav.attendance, icon: 'clock' },
    admin && { to: '/team', label: he.nav.team, icon: 'users' },
    admin && { to: '/reports', label: he.nav.reports, icon: 'report' },
  ].filter(Boolean);

  const sections = [
    { items: main },
    { items: [{ to: '/settings', label: he.nav.settings, icon: 'settings' }] },
  ];

  if (isPlatformAdmin) {
    sections.push({
      label: s.platformGroup,
      items: [
        { to: '/platform/tickets', label: he.platform.nav, icon: 'support' },
        { to: '/platform/orgs', label: he.platform.navOrgs, icon: 'org' },
      ],
    });
  }
  return sections;
}

// פריט ניווט — NavLink. פעיל: רקע צהוב שקוף עדין + פס צהוב דק בקצה הימני
// + טקסט לבן (הצהוב מסמן, לא צובע). collapsed → אייקון + tooltip.
function NavItem({ item, collapsed, onNavigate }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `relative ${ITEM} ${collapsed ? 'justify-center' : 'justify-start'} ${
          isActive ? 'bg-brandYellow/[0.14] text-white hover:bg-brandYellow/[0.14] hover:text-white' : ''
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute inset-y-1.5 right-0 w-[3px] rounded-sm bg-brandYellow" aria-hidden="true" />
          )}
          <Icon name={item.icon} size="nav" strokeWidth={2} className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

function SidebarNav({ collapsed, onNavigate }) {
  const sections = useNavSections();
  return (
    <nav className="flex flex-col gap-1">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-1">
          {i > 0 && <div className="my-2 border-t border-sidebarLine" />}
          {section.label && !collapsed && (
            <div className="px-3 pb-1 text-[10.5px] font-semibold tracking-wide text-sidebarLabel">
              {section.label}
            </div>
          )}
          {section.items.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
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
      {/* דסקטופ — גובה מלא: ניווט, ובתחתית תמיכה + כפתור קיפול. */}
      <aside
        style={{ width }}
        className="hidden shrink-0 bg-sidebar text-sidebarText transition-all duration-200 md:block"
      >
        <div className="sticky top-[68px] flex h-[calc(100vh-68px)] flex-col p-3">
          <div className="flex-1 overflow-y-auto">
            <SidebarNav collapsed={collapsed} />
          </div>

          {/* פוטר — תמיכה + קיפול, מופרד מהניווט בקו עליון */}
          <div className="mt-2 flex flex-col gap-1 border-t border-sidebarLine pt-2">
            <button
              type="button"
              onClick={onSupport}
              aria-label={he.support.trigger}
              title={collapsed ? he.support.trigger : undefined}
              className={`${ITEM} ${collapsed ? 'justify-center' : 'justify-start'}`}
            >
              <Icon name="support" size="nav" strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{he.support.trigger}</span>}
            </button>
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? s.expand : s.collapse}
              title={collapsed ? s.expand : s.collapse}
              className={`${ITEM} ${collapsed ? 'justify-center' : 'justify-start'}`}
            >
              <Icon
                name="back"
                size="nav"
                strokeWidth={2}
                className={`shrink-0 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`}
              />
              {!collapsed && <span className="truncate">{s.collapse}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* מובייל — מגירה (יורשת את העיצוב החדש; ההתנהגות ללא שינוי) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="absolute inset-y-0 right-0 flex w-72 max-w-[85%] flex-col bg-sidebar text-sidebarText shadow-xl">
            <div className="flex items-center justify-between p-3">
              <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label={s.close}
                className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-sidebarText hover:bg-white/[0.07] hover:text-white"
              >
                <Icon name="close" size="nav" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3">
              <SidebarNav collapsed={false} onNavigate={onCloseMobile} />
            </div>

            {/* פוטר — פעולות מהירות + משתמש + תמיכה + יציאה */}
            <div className="border-t border-sidebarLine p-3">
              <TopbarActions onDone={onCloseMobile} />
              <div className="my-3 border-t border-sidebarLine" />
              <div className="mb-2 truncate text-sm text-sidebarText">{member?.full_name}</div>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" size="sm" className="justify-start text-white hover:bg-white/[0.07]" onClick={onSupport}>
                  {he.support.trigger}
                </Button>
                <Button variant="ghost" size="sm" className="justify-start text-white hover:bg-white/[0.07]" onClick={() => supabase.auth.signOut()}>
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
