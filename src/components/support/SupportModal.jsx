import { useState } from 'react';
import { he } from '../../locales/he';
import { useOrg } from '../../lib/orgContext';
import { useSubmitTicket } from '../../hooks/useSupportTickets';
import Modal from '../shared/Modal';
import Field from '../ui/Field';
import Textarea from '../shared/Textarea';
import Button from '../shared/Button';

const t = he.support;

export default function SupportModal({ onClose }) {
  const { member } = useOrg();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const { submit, busy, error } = useSubmitTicket();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const ok = await submit({
      orgId: member.org_id,
      authorId: member.id,
      subject: subject.trim(),
      message: message.trim(),
    });
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <Modal title={t.title} onClose={onClose}>
        <p className="mb-2 text-lg font-bold text-green-700">{t.sent}</p>
        <p className="mb-6 text-sm text-grayMid">{t.sentHint}</p>
        <Button type="button" onClick={onClose} className="w-full">
          {he.common.cancel}
        </Button>
      </Modal>
    );
  }

  return (
    <Modal title={t.title} onClose={onClose}>
      <p className="mb-4 text-sm text-grayMid">{t.subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field
          label={t.subject}
          value={subject}
          onChange={setSubject}
          required
        />
        <Textarea
          label={t.message}
          value={message}
          onChange={setMessage}
          rows={5}
          required
        />

        {error && (
          <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
            {t.sendError}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={busy}>
            {busy ? he.common.loading : he.common.save}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
