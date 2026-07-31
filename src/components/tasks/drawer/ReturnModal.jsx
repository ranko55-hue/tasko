import { useState } from 'react';
import { he } from '../../../locales/he';
import { returnTask } from '../../../lib/taskFlow';
import Modal from '../../shared/Modal';
import Textarea from '../../shared/Textarea';

const d = he.tasks.drawer;

export default function ReturnModal({ task, actorId, onClose, onDone }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    setError('');
    if (!text.trim()) return setError(d.returnRequired);

    setBusy(true);
    try {
      await returnTask(task, actorId, text.trim());
      onDone();
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <Modal title={d.returnTitle} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{d.returnHint}</p>

        <Textarea
          label=""
          value={text}
          onChange={setText}
          placeholder={d.returnPlaceholder}
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
            className="min-h-touch flex-1 rounded-xl bg-amber-500 px-4 font-bold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {busy ? he.common.loading : d.returnBtn}
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
