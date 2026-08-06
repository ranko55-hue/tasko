import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { startCheckout } from '../../hooks/useBilling';
import { he } from '../../locales/he';
import Button from '../shared/Button';

const b = he.billing;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('he-IL') : '');

// מסך נעילה — ניסיון שפג / חיוב שנכשל סופית / ביטול שהסתיים. הנתונים נשמרים 30 יום.
export default function LockScreen({ status }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const reason =
    status?.status === 'expired' ? b.lockExpired :
    status?.status === 'canceled' ? b.lockCanceled : b.lockTrialEnded;

  async function pay() {
    setBusy(true);
    setErr('');
    try { await startCheckout(); } catch { setErr(b.checkoutError); setBusy(false); }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center">
        <img src="/brand/tasko-header-light.png" alt={he.app.name} className="mx-auto mb-6 h-9 w-auto" />
        <h1 className="text-2xl font-black text-navy">{b.lockTitle}</h1>
        <p className="mt-2 text-grayMid">{reason}</p>
        {status?.data_purge_at && (
          <p className="mt-2 text-sm text-grayLight">{b.retention.replace('{date}', fmtDate(status.data_purge_at))}</p>
        )}

        {status?.is_admin ? (
          <div className="mt-6">
            <Button onClick={pay} disabled={busy}>
              {busy ? he.common.loading : b.payNow.replace('{amount}', status.next_amount)}
            </Button>
            {err && <p className="mt-2 text-sm font-medium text-urgentInk">{err}</p>}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-surface p-3 text-sm text-grayMid">{b.contactAdmin}</p>
        )}

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-6 text-sm font-bold text-grayMid hover:text-navy"
        >
          {he.common.logout}
        </button>
      </div>
    </div>
  );
}
