import { Outlet } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { useBilling } from '../../hooks/useBilling';
import { he } from '../../locales/he';
import LockScreen from './LockScreen';

// שער חיוב — עוטף את האזור המחובר. ארגון נעול → מסך נעילה לכל החברים.
// מפעיל הפלטפורמה (super-admin) פטור כדי שלא ינעל את עצמו מלוח הארגונים.
export default function BillingGate() {
  const { isPlatformAdmin } = useOrg();
  const { status, locked, loading } = useBilling();

  if (loading) {
    return <div className="flex min-h-full items-center justify-center"><p className="text-grayMid">{he.common.loading}</p></div>;
  }
  if (locked && !isPlatformAdmin) return <LockScreen status={status} />;
  return <Outlet />;
}
