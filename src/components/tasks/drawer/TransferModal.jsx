import { useState } from 'react';
import { he } from '../../../locales/he';
import { transferTask } from '../../../lib/taskFlow';
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
        <p className="text-sm text-slate-500">{d.transferHint}</p>

        <div>
          <label className="mb-1 block text-sm font-bold text-slate-700">
            {d.transferWorker}
          </label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="min-h-touch w-full rounded-xl border border-line bg-white px-3 text-slate-900"
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={send}
            className="min-h-touch flex-1 rounded-xl bg-brand px-4 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {busy ? he.common.loading : d.transferBtn}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch rounded-xl border-2 border-line px-5 font-bold text-slate-700"
          >
            {he.common.cancel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
