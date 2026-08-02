import { useState } from 'react';
import { he } from '../../locales/he';
import { useOrg } from '../../lib/orgContext';
import { useOrgManagers } from '../../hooks/useOrgManagers';
import { isAdmin } from '../../lib/roles';
import Button from '../shared/Button';
import Field from '../ui/Field';
import ManagerPicker from '../shared/ManagerPicker';

const t = he.clients;

// טופס לקוח חדש — שם חובה, שאר השדות רשות.
// בחירת המנהלים האחראים מוצגת ל-admin בלבד: הקצאה היא פעולה ניהולית,
// ו-RLS (מיגרציה 015) חוסם כתיבה ל-client_managers לכל תפקיד אחר.
export default function ClientForm({ onSubmit, onCancel }) {
  const { member } = useOrg();
  const { managers } = useOrgManagers(member?.org_id);
  const [managerIds, setManagerIds] = useState([]);
  const admin = isAdmin(member);
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
      await onSubmit(cleaned, admin ? managerIds : []);
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

      {admin && (
        <div>
          <p className="mb-1 text-sm font-bold text-inkSoft">{he.assignments.clientManagers}</p>
          <p className="mb-2 text-xs text-grayMid">{he.assignments.clientManagersHint}</p>
          <ManagerPicker managers={managers} value={managerIds} onChange={setManagerIds} />
        </div>
      )}

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
