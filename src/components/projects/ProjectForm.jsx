import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';

const t = he.projects;

// טופס פרויקט חדש — שם חובה, כתובת רשות.
export default function ProjectForm({ onSubmit, onCancel }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError(t.nameRequired);

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        address: address.trim() || null,
      });
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.name} value={name} onChange={setName} />
      <Field
        label={`${t.address} ${he.common.optional}`}
        value={address}
        onChange={setAddress}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
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
