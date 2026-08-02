import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Select from '../shared/Select';

const t = he.tasks;

// בורר יעד המשימה (אפיון v8 §3.4): לקוח חובה ← פרויקט רשות מסונן ללקוח.
// lockedClient / lockedProject — יצירה מתוך הקשר: הבורר מוצג נעול ולא ניתן לשינוי.
export default function TaskTargetPicker({
  clients,
  projects,
  clientId,
  projectId,
  onClientChange,
  onProjectChange,
  onQuickClient,
  requireProject = false,
  lockedClient = false,
  lockedProject = false,
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // רק פרויקטים של הלקוח הנבחר — האילוץ נאכף גם בשרת (טריגר)
  const clientProjects = projects.filter((p) => p.client_id === clientId);
  const selectedClient = clients.find((c) => c.id === clientId);
  const selectedProject = projects.find((p) => p.id === projectId);

  async function createClient(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError(t.quickClientNameRequired);

    setBusy(true);
    try {
      await onQuickClient({ name: name.trim(), contact_phone: phone.trim() || null });
      setName('');
      setPhone('');
      setAdding(false);
    } catch {
      setError(t.quickClientError);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-4 rounded-xl bg-surface p-3">
      {/* לקוח — חובה */}
      {lockedClient ? (
        <LockedRow label={t.client} value={selectedClient?.name} />
      ) : (
        <>
          <Select label={t.client} value={clientId} onChange={onClientChange}>
            <option value="">{t.clientRequired}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          {!adding && (
            <Button variant="dashed" size="sm" onClick={() => setAdding(true)}>
              {t.quickClient}
            </Button>
          )}

          {adding && (
            <div className="space-y-3 rounded-lg border border-line bg-white p-3">
              <Field label={t.quickClientName} value={name} onChange={setName} />
              <Field
                label={`${t.quickClientPhone} ${he.common.optional}`}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={setPhone}
              />
              {error && (
                <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
                  {error}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" disabled={busy} fullWidth={false} className="flex-1" onClick={createClient}>
                  {busy ? he.common.loading : t.quickClientCreate}
                </Button>
                <Button variant="secondary" size="sm" fullWidth={false} onClick={() => { setAdding(false); setError(''); }}>
                  {he.common.cancel}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* פרויקט — רשות, אלא אם ההגדרה דולקת */}
      {lockedProject ? (
        <LockedRow label={t.project} value={selectedProject?.name} />
      ) : (
        <Select
          label={requireProject ? t.project : `${t.project} ${he.common.optional}`}
          value={projectId}
          onChange={onProjectChange}
          disabled={!clientId}
        >
          <option value="">{requireProject ? t.projectRequired : t.noProject}</option>
          {clientProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}

      {!lockedProject && clientId && clientProjects.length === 0 && (
        <p className="text-sm text-grayMid">{t.noProjectsForClient}</p>
      )}
    </div>
  );
}

// שורת הקשר נעול — מוצג כערך ולא כבורר
function LockedRow({ label, value }) {
  return (
    <div>
      <div className="mb-1 text-sm font-bold text-grayDark">{label}</div>
      <div className="rounded-lg border border-line bg-white px-3 py-3 font-medium text-navy">
        {value ?? he.common.none}
      </div>
    </div>
  );
}
