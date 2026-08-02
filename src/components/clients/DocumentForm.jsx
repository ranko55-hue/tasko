import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Select from '../shared/Select';

const f = he.clientDetail.finance;

// טופס מסמך כספי חדש — סוג, כותרת, סכום. סטטוס התחלתי: טיוטה.
export default function DocumentForm({ onSubmit, onCancel }) {
  const [kind, setKind] = useState('quote');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!title.trim()) return setError(he.common.required);
    setBusy(true);
    try {
      await onSubmit({
        kind,
        title: title.trim(),
        amount: amount ? Number(amount) : null,
        status: 'draft',
      });
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Select label={f.kind} value={kind} onChange={setKind}>
        {Object.entries(f.kinds).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>
      <Field label={f.title} value={title} onChange={setTitle} />
      <Field
        label={f.amount}
        type="number"
        inputMode="numeric"
        value={amount}
        onChange={setAmount}
      />

      {error && (
        <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={busy}>
          {busy ? he.common.loading : he.common.save}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    </form>
  );
}
