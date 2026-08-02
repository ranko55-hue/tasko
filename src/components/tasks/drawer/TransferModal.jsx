import { useState } from 'react';
import { he } from '../../../locales/he';
import { transferTask } from '../../../lib/taskFlow';
import Button from '../../shared/Button';
import Modal from '../../shared/Modal';
import Textarea from '../../shared/Textarea';

const d = he.tasks.drawer;

export default function TransferModal({ task, actorId, members, onClose, onDone }) {
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const workers = (members ?? []).filter(
    (m) => m.is_active && m.id !== task.assignee_id,
  );

  async function send() {
    setError('');
    if (!targetId) return setError(d.transferWorkerRequired);
    if (!reason.trim()) return setError(d.transferReasonRequired);

    setBusy(true);
    try {
      await transferTask(task, actorId, targetId, reason.trim());
      onDone();
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <Modal title={d.transferTitle} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-grayMid">{d.transferHint}</p>

        <div>
          <label className="mb-1 block text-sm font-bold text-inkSoft">
            {d.transferWorker}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="min-h-touch w-full rounded-xl border border-line bg-white px-3 text-navy"
          >
            <option value="">{he.common.none}</option>
            {workers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          label={d.transferReason}
          value={reason}
          onChange={setReason}
          placeholder={d.transferReasonPlaceholder}
          rows={3}
        />

        {error && (
          <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button disabled={busy} fullWidth={false} className="flex-1" onClick={send}>
            {busy ? he.common.loading : d.transferBtn}
          </Button>
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
