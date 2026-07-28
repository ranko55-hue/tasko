import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';

const t = he.tasks;

// ביטול משימה — סיבה חובה. אין מחיקה: המשימה מסומנת cancelled ונשארת ביומן.
// הסיבה וההרשאה נאכפות שוב ב-RPC cancel_task בצד השרת.
export default function TaskCancelForm({ onConfirm, onBack }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!reason.trim()) return setError(t.cancelReasonRequired);

    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      const msg = String(err?.message ?? '');
      setError(msg.includes('not_manager') ? t.notManager : t.cancelFailed);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl bg-red-50 p-4">
      <p className="text-sm text-slate-600">{t.cancelHint}</p>

      <Textarea label={t.cancelReason} value={reason} onChange={setReason} />

      {error && (
        <p className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" variant="danger" disabled={busy}>
          {busy ? he.common.loading : t.cancelConfirm}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack}>
          {he.common.back}
        </Button>
      </div>
    </form>
  );
}
