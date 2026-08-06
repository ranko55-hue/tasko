import { useState } from 'react';
import { useMemberAccess } from '../../hooks/useMemberAccess';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import InviteResultModal from './InviteResultModal';

const t = he.team.access;

const BADGE = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  expired: 'bg-urgentSoft text-urgentInk',
};

// חיווי מצב גישה לעובד + שליחת הזמנה מחדש (admin). מצב נגזר מ-auth_user_id
// ומההזמנה האחרונה.
export default function MemberAccessCard({ memberId, orgId, phone }) {
  const { member, status, resend } = useMemberAccess(memberId, orgId);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState(null);
  const [err, setErr] = useState('');

  async function doResend() {
    setBusy(true);
    setErr('');
    try {
      const token = await resend();
      setInvite({ token });
    } catch {
      setErr(t.resendError);
    }
    setBusy(false);
  }

  return (
    <div className="border-t border-line pt-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-inkSoft">{t.label}</p>
          <span className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold ${BADGE[status]}`}>
            {t[status]}
          </span>
        </div>
        {status !== 'active' && (
          <Button variant="secondary" size="sm" fullWidth={false} onClick={doResend} disabled={busy}>
            {busy ? he.common.loading : t.resend}
          </Button>
        )}
      </div>

      {err && <p className="mt-2 text-sm font-medium text-urgentInk">{err}</p>}

      {invite && (
        <Modal title={he.team.invite.title} onClose={() => setInvite(null)}>
          <InviteResultModal
            token={invite.token}
            fullName={member?.full_name}
            phone={phone || member?.phone}
            orgId={orgId}
            onClose={() => setInvite(null)}
          />
        </Modal>
      )}
    </div>
  );
}
