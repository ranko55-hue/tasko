import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import NavLinks from '../shared/NavLinks';

// כותרת מגדל הפיקוח — כהה (navy), לוגו לבן, אינדיקטור חיות.
export default function DashboardHeader({ connection }) {
  const live = connection === 'live';
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-1 sm:gap-3">
        <Link to="/dashboard" className="flex items-center">
          <img
            src="/brand/tasko-header-dark.png"
            alt={he.app.name}
            className="h-7 w-auto"
          />
        </Link>
        <NavLinks dark />
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-slate-300">
          <span
            className={`h-2 w-2 rounded-full ${live ? 'animate-pulse bg-statusGreen' : 'bg-slate-500'}`}
          />
          {live ? he.dashboard.live : he.dashboard.polling}
        </span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10"
        >
          {he.common.logout}
        </button>
      </div>
    </header>
  );
}
