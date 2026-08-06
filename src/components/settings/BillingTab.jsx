import { useState } from 'react';
import { useBilling, useBillingDetails, startCheckout, startReplaceCard, cancelSubscription } from '../../hooks/useBilling';
import { he } from '../../locales/he';
import Button from '../shared/Button';

const b = he.billing;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('he-IL') : '—');
const NUM = { fontVariantNumeric: 'tabular-nums' };
const TONE = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-appBg text-grayMid',
  expired: 'bg-urgentSoft text-urgentInk',
};

// לשונית "חיוב" — אדמין בלבד. מצב, חישוב, היסטוריה, אמצעי תשלום, ביטול.
export default function BillingTab({ orgId }) {
  const { status, reload } = useBilling();
  const { sub, invoices, loading, reload: reloadDetails } = useBillingDetails(orgId, true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  async function act(fn, key) {
    setBusy(key); setErr('');
    try { await fn(); } catch { setErr(b.actionError); }
    setBusy('');
  }
  const refresh = () => { reload(); reloadDetails(); };

  if (loading) return <p className="py-6 text-center text-grayMid">{he.common.loading}</p>;

  const seats = status?.seats ?? 0;
  const extra = Math.max(0, seats - 2);
  const amount = status?.next_amount ?? 199;
  const st = sub?.status ?? status?.status;
  const canceled = sub?.cancel_at_period_end;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="font-black text-navy">{b.currentPlan}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[st] || ''}`}>{b.status[st] || st}</span>
        </div>
        {st === 'trialing' && status?.trial_ends_at && (
          <p className="mt-2 text-sm text-grayMid">{b.trialEnds.replace('{date}', fmtDate(status.trial_ends_at))}</p>
        )}
        {st === 'active' && sub?.current_period_end && (
          <p className="mt-2 text-sm text-grayMid">
            {(canceled ? b.accessUntil : b.nextCharge).replace('{date}', fmtDate(sub.current_period_end)).replace('{amount}', amount)}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-surface p-4">
        <div className="text-[11px] font-bold tracking-wide text-grayMid">{b.howCalc}</div>
        <p className="mt-1 text-sm font-bold text-navy" style={NUM}>
          {b.calcLine.replace('{extra}', extra).replace('{amount}', amount)}
        </p>
        <p className="mt-1 text-xs text-grayLight">{b.vatNote}</p>
      </div>

      {['trialing', 'expired', 'past_due'].includes(st) && (
        <Button onClick={() => act(startCheckout, 'pay')} disabled={busy === 'pay'}>
          {busy === 'pay' ? he.common.loading : b.startNow.replace('{amount}', amount)}
        </Button>
      )}

      {sub?.card_last4 && (
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-[11px] font-bold tracking-wide text-grayMid">{b.paymentMethod}</div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span dir="ltr" className="font-bold text-navy">●●●● {sub.card_last4} · {sub.card_exp}</span>
            <Button variant="secondary" size="sm" fullWidth={false} onClick={() => act(startReplaceCard, 'card')} disabled={busy === 'card'}>
              {b.updateCard}
            </Button>
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 text-[11px] font-bold tracking-wide text-grayMid">{b.history}</div>
        {invoices.length === 0 ? (
          <p className="rounded-lg bg-surface p-3 text-sm text-grayLight">{b.noInvoices}</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
                <span className="text-sm font-bold text-navy">{fmtDate(inv.charged_at)}</span>
                <span className="text-sm text-grayMid" style={NUM}>{inv.amount} ₪</span>
                {inv.invoice_url ? (
                  <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="mr-auto text-sm font-bold text-brand hover:underline">
                    {b.viewInvoice}
                  </a>
                ) : inv.invoice_number ? (
                  <span className="mr-auto text-sm text-grayLight">{b.invoiceNo.replace('{n}', inv.invoice_number)}</span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {['active', 'trialing'].includes(st) && (
        canceled ? (
          <Button variant="secondary" fullWidth={false} disabled={busy === 'resume'}
            onClick={() => act(() => cancelSubscription('resume').then(refresh), 'resume')}>
            {b.resume}
          </Button>
        ) : (
          <button type="button" className="text-sm font-bold text-urgentInk hover:underline"
            onClick={() => { if (window.confirm(b.cancelConfirm)) act(() => cancelSubscription('cancel').then(refresh), 'cancel'); }}>
            {b.cancel}
          </button>
        )
      )}

      {err && <p className="text-sm font-medium text-urgentInk">{err}</p>}
    </div>
  );
}
