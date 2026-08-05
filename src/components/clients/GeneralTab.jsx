import { useState } from 'react';
import { he } from '../../locales/he';
import { formatDate } from '../../lib/time';
import { useCustomFields } from '../../hooks/useCustomFields';
import { useCustomFieldValues } from '../../hooks/useCustomFieldValues';
import Button from '../shared/Button';
import Field from '../ui/Field';
import CustomFieldInput from '../tasks/CustomFieldInput';

const g = he.clientDetail.general;
// כותרת מקטע טקסטואלית קטנה — בלי קונטיינר. משמשת גם בצפייה וגם בעריכה.
const SECTION_LABEL = 'text-[11px] font-bold tracking-wide text-grayMid';

function Tile({ label, value }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-xs text-grayLight">{label}</div>
      <div className="mt-1 font-bold text-navy">{value || he.common.none}</div>
    </div>
  );
}

const STD_FIELDS = ['name', 'contact_name', 'contact_phone', 'contact_email', 'business_id', 'address', 'payment_terms'];
const STD_LABEL = {
  name: g.name, contact_name: g.contactName, contact_phone: g.phone,
  contact_email: g.email, business_id: g.businessId, address: g.address,
  payment_terms: g.paymentTerms,
};

// לשונית "כללי" — צפייה + מצב עריכה (למנהל). כולל שדות מותאמים ללקוח.
export default function GeneralTab({ client, orgId, canEdit, onSave }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [custom, setCustom] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { fields } = useCustomFields(orgId, 'client');
  const { values, saveValues } = useCustomFieldValues(orgId, 'client', client?.id);

  const link = `tasko.app/r/${client?.service_slug ?? ''}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText('https://' + link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* הקישור מוצג בכל מקרה */ }
  }

  function startEdit() {
    setForm(Object.fromEntries(STD_FIELDS.map((k) => [k, client?.[k] ?? ''])));
    setCustom({ ...values });
    setError('');
    setEditing(true);
  }

  async function save() {
    setError('');
    if (!form.name?.trim()) return setError(g.nameRequired);
    setBusy(true);
    try {
      const patch = Object.fromEntries(STD_FIELDS.map((k) => [k, k === 'name' ? form.name.trim() : (form[k]?.trim() || null)]));
      await onSave(patch);
      if (fields.length) await saveValues(custom);
      setEditing(false);
    } catch {
      setError(g.saveError);
    } finally {
      setBusy(false);
    }
  }

  // ── מצב עריכה ──
  if (editing) {
    return (
      <div className="space-y-4">
        {STD_FIELDS.map((k) => (
          <Field key={k} label={STD_LABEL[k]} value={form[k] ?? ''} onChange={(v) => setForm((f) => ({ ...f, [k]: v }))} />
        ))}

        {fields.length > 0 && (
          <>
            <div className={SECTION_LABEL}>{g.moreDetails}</div>
            {fields.map((def) => (
              <CustomFieldInput
                key={def.id}
                def={def}
                value={custom[def.id]}
                onChange={(v) => setCustom((c) => ({ ...c, [def.id]: v }))}
              />
            ))}
          </>
        )}

        {error && (
          <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button onClick={save} disabled={busy}>{busy ? he.common.loading : he.common.save}</Button>
          <Button variant="ghost" onClick={() => setEditing(false)}>{he.common.cancel}</Button>
        </div>
      </div>
    );
  }

  // ── מצב צפייה ──
  return (
    <div className="space-y-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button variant="secondary" size="sm" fullWidth={false} onClick={startEdit}>{g.edit}</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Tile label={g.contactName} value={client?.contact_name} />
        <Tile label={g.phone} value={client?.contact_phone} />
        <Tile label={g.email} value={client?.contact_email} />
        <Tile label={g.businessId} value={client?.business_id} />
        <Tile label={g.address} value={client?.address} />
        <Tile label={g.paymentTerms} value={client?.payment_terms} />

        {/* שדות מותאמים — ממשיכים את אותו גריד, אריח זהה לשדה מובנה */}
        {fields.length > 0 && (
          <div className={`col-span-2 mt-1 ${SECTION_LABEL}`}>{g.moreDetails}</div>
        )}
        {fields.map((f) => (
          <Tile key={f.id} label={f.label} value={values[f.id]} />
        ))}
      </div>

      {client?.created_at && (
        <p className="px-1 text-sm text-grayLight">
          {g.addedOn.replace('{date}', formatDate(client.created_at))}
        </p>
      )}

      <div className="rounded-lg bg-surface p-3">
        <div className="text-xs text-grayLight">{g.serviceLink}</div>
        <div className="mt-1 flex items-center gap-2">
          <code dir="ltr" className="min-w-0 flex-1 truncate text-sm text-inkSoft">{link}</code>
          <Button variant="dark" size="sm" fullWidth={false} className="shrink-0" onClick={copy}>
            {copied ? g.copied : g.copy}
          </Button>
        </div>
      </div>
    </div>
  );
}
