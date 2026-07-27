import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';
import NavLinks from '../shared/NavLinks';
import QuickActions from './QuickActions';

// מגירת מובייל — אותו ניווט ואותן פעולות כמו הדסקטופ (רק במגירה).
export default function MobileDrawer({ onClose }) {
  const { member } = useOrg();
  return (
    <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="absolute right-0 top-0 h-full w-72 max-w-[85%] bg-navy p-4 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <img src="/brand/tasko-header-dark.png" alt={he.app.name} className="h-7 w-auto" />
          <button type="button" onClick={onClose} aria-label={he.shell.close} className="px-2 text-3xl leading-none">
            ×
          </button>
        </div>

        <NavLinks dark vertical onNavigate={onClose} />

        <div className="my-4 border-t border-white/10" />
        <div className="mb-2 text-xs font-bold text-slate-400">{he.shell.quickActions}</div>
        <QuickActions vertical onDone={onClose} />

        <div className="my-4 border-t border-white/10" />
        <div className="mb-2 text-sm text-slate-300">{member?.full_name}</div>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="min-h-touch w-full rounded-lg bg-white/10 px-3 text-start font-bold text-white"
        >
          {he.common.logout}
        </button>
      </div>
    </div>
  );
}
