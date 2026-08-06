import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';

const b = he.billing;
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('he-IL') : '—');
const TONE = {
  trialing: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-appBg text-grayMid',
  expired: 'bg-urgentSoft text-urgentInk',
  vip: 'bg-purple-100 text-purple-700',
};

// רצועת חיוב פר ארגון בלוח הפלטפורמה + הארכת ניסיון + סימון VIP.
export default function PlatformBillingStrip({ billing, onExtend, onSetVip }) {
  const [busy, setBusy] = useState(false);
  if (!billing) return null;
  const st = billing.status || 'trialing';
  const isVip = st === 'vip';

  async function extend(days) {
    setBusy(true);
    try { await onExtend(days); } finally { setBusy(false); }
  }
  async function toggleVip() {
    setBusy(true);
    try { await onSetVip(!isVip); } finally { setBusy(false); }
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${TONE[st] || ''}`}>{b.status[st] || st}</span>
      <span className="text-grayMid" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {billing.seats} {b.seatsUnit} · {billing.next_amount} ₪
      </span>
      {st === 'trialing' && billing.trial_ends_at && (
        <span className="text-grayLight">{b.trialEndsShort.replace('{date}', fmtDate(billing.trial_ends_at))}</span>
      )}
      {st === 'active' && billing.current_period_end && (
        <span className="text-grayLight">{fmtDate(billing.current_period_end)}</span>
      )}
      <div className="mr-auto flex gap-2">
        {!isVip && (
          <>
            <Button variant="secondary" size="sm" fullWidth={false} disabled={busy} onClick={() => extend(7)}>+7</Button>
            <Button variant="secondary" size="sm" fullWidth={false} disabled={busy} onClick={() => extend(14)}>+14</Button>
          </>
        )}
        <Button variant={isVip ? 'danger' : 'dark'} size="sm" fullWidth={false} disabled={busy} onClick={toggleVip}>
          {isVip ? b.unsetVip : b.setVip}
        </Button>
      </div>
    </div>
  );
}
