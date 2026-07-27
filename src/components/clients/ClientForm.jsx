import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';

const t = he.clients;

// טופס לקוח חדש — שם חובה, שאר השדות רשות.
export default function ClientForm({ onSubmit, onCancel }) {
  const [f, setF] = useState({
    name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    business_id: '',
    address: '',
    payment_terms: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.name.trim()) return setError(t.nameRequired);

    setBusy(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(f).map(([k, v]) => [k, v.trim() === '' ? null : v.trim()])
      );
      await onSubmit(cleaned);
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.name} value={f.name} onChange={set('name')} />
      <Field label={`${t.contactName} ${he.common.optional}`} value={f.contact_name} onChange={set('contact_name')} />
      <Field label={`${t.phone} ${he.common.optional}`} type="tel" inputMode="tel" value={f.contact_phone} onChange={set('contact_phone')} />
      <Field label={`${t.email} ${he.common.optional}`} type="email" inputMode="email" value={f.contact_email} onChange={set('contact_email')} />
      <Field label={`${t.businessId} ${he.common.optional}`} value={f.business_id} onChange={set('business_id')} />
      <Field label={`${t.address} ${he.common.optional}`} value={f.address} onChange={set('address')} />
      <Field label={`${t.paymentTerms} ${he.common.optional}`} value={f.payment_terms} onChange={set('payment_terms')} placeholder={t.paymentTermsPlaceholder} />

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
