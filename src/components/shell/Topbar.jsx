import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/orgContext';
import { homePathFor } from '../../lib/roles';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';
import SearchBar from './SearchBar';
import TopbarActions from './TopbarActions';

const t = he.topbar;

// תאריך ושעה מלאים בעברית, מתעדכן כל 30 שניות.
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const date = now.toLocaleDateString('he-IL', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
  const time = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

function IconLink({ icon, label, onClick, to }) {
  const cls =
    'flex h-10 w-10 items-center justify-center rounded-lg text-lineDark transition-colors hover:bg-white/10 hover:text-white';
  if (to) {
    return (
      <Link to={to} title={label} aria-label={label} className={cls}>
        <Icon name={icon} size="md" />
      </Link>
    );
  }
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>
      <Icon name={icon} size="md" />
    </button>
  );
}

// פס עליון בהשראת CRM (מנהלים). ה-px-3 מיישר את הקצה הימני של הברכה
// לעמודת ה-sidebar. מובייל: המבורגר + חיפוש + לוגו; השאר מוסתר.
export default function Topbar({ onMenu, onRefresh }) {
  const { member } = useOrg();
  const [searchOpen, setSearchOpen] = useState(false);
  const clock = useClock();
  const firstName = member?.full_name?.split(' ')[0] ?? '';

  return (
    <header className="sticky top-0 z-40 h-[68px] shrink-0 bg-navy text-white">
      <div className={`grid h-full items-center gap-3 px-3 ${searchOpen ? 'grid-cols-[auto_1fr_auto]' : 'grid-cols-[1fr_auto_1fr]'}`}>
        {/* צד ימין (RTL) — ברכה + בית + יציאה. מובייל: המבורגר */}
        <div className="flex min-w-0 items-center gap-2 justify-self-start">
          <button
            type="button"
            onClick={onMenu}
            aria-label={he.sidebar.menu}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-lg text-line hover:bg-white/10 md:hidden"
          >
            <Icon name="menu" size="md" />
          </button>

          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-bold text-white">{t.hello}, {firstName}</div>
              <div className="truncate text-xs text-lineDark">{clock}</div>
            </div>
            <IconLink icon="home" label={t.home} to={homePathFor(member)} />
            <IconLink icon="logout" label={t.logout} onClick={() => supabase.auth.signOut()} />
          </div>
        </div>

        {/* מרכז — חיפוש + פעולות מהירות צמודות משמאלו */}
        <div className={`flex items-center gap-2 justify-self-center ${searchOpen ? 'w-full' : ''}`}>
          <div className={searchOpen ? 'w-full' : 'md:w-96'}>
            <SearchBar onExpandedChange={setSearchOpen} />
          </div>
          <div className="hidden md:block">
            <TopbarActions onDone={onRefresh} />
          </div>
        </div>

        {/* צד שמאל (RTL) — לוגו בקצה */}
        <Link
          to={homePathFor(member)}
          className="flex items-center justify-self-end"
          aria-label={he.app.name}
        >
          <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
        </Link>
      </div>
    </header>
  );
}
