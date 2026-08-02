import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';

const t = he.projects;

// טופס פרויקט חדש — שם חובה, כתובת רשות.
export default function ProjectForm({ onSubmit, onCancel, members = [] }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sku, setSku] = useState('');
  const [details, setDetails] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [managerId, setManagerId] = useState('');
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
        sku: sku.trim() || null,
        details: details.trim() || null,
        ends_at: endsAt || null,
        // נשלח רק כשנבחר מנהל, כדי שיצירת פרויקט רגילה תעבוד גם לפני מיגרציה 006
        ...(managerId ? { manager_id: managerId } : {}),
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
      <Field
        label={`${t.sku} ${he.common.optional}`}
        value={sku}
        onChange={setSku}
      />
      <Textarea
        label={`${t.details} ${he.common.optional}`}
        value={details}
        onChange={setDetails}
      />
      <Field
        label={`${t.endsAt} ${he.common.optional}`}
        type="date"
        value={endsAt}
        onChange={setEndsAt}
      />
      <Select
        label={`${t.manager} ${he.common.optional}`}
        value={managerId}
        onChange={setManagerId}
      >
        <option value="">{t.noManager}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </Select>

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
