import { useState } from 'react';
import { he } from '../../../locales/he';
import { returnTask } from '../../../lib/taskFlow';
import Button from '../../shared/Button';
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
        <p className="text-sm text-grayMid">{d.returnHint}</p>

        <Textarea
          label=""
          value={text}
          onChange={setText}
          placeholder={d.returnPlaceholder}
          rows={3}
        />

        {error && (
          <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="warning" disabled={busy} fullWidth={false} className="flex-1" onClick={send}>
            {busy ? he.common.loading : d.returnBtn}
          </Button>
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
