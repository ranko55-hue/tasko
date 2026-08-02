import { supabase } from '../../lib/supabase';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import NavLinks from '../shared/NavLinks';
import QuickActions from './QuickActions';
import Icon from '../ui/Icon';

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
          <button type="button" onClick={onClose} aria-label={he.shell.close} className="px-2">
            <Icon name="close" size="md" />
          </button>
        </div>

        <NavLinks dark vertical onNavigate={onClose} />

        <div className="my-4 border-t border-white/10" />
        <div className="mb-2 text-xs font-bold text-grayLight">{he.shell.quickActions}</div>
        <QuickActions vertical onDone={onClose} />

        <div className="my-4 border-t border-white/10" />
        <div className="mb-2 text-sm text-lineDark">{member?.full_name}</div>
        <Button variant="ghost" className="text-start text-white hover:bg-white/10" onClick={() => supabase.auth.signOut()}>
          {he.common.logout}
        </Button>
      </div>
    </div>
  );
}
