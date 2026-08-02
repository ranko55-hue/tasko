import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { useOrgManagers } from '../../hooks/useOrgManagers';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import ManagerPicker from '../shared/ManagerPicker';

const t = he.team.form;
const ROLES = [
  { value: 'worker', label: he.roles.worker },
  { value: 'manager', label: he.roles.manager },
  { value: 'admin', label: he.roles.admin },
];

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function MemberForm({ onCreated, onCancel }) {
  const { member } = useOrg();
  const { managers } = useOrgManagers(member?.org_id);
  const [f, setF] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    phone2: '',
    role: 'worker',
    manager_id: null,
    gender: 'm',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const needsManager = f.role === 'worker';
  const showManager = f.role !== 'admin';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.full_name.trim()) return setError(t.nameRequired);
    if (!f.email.trim()) return setError(t.emailRequired);
    if (!isValidEmail(f.email.trim())) return setError(t.emailInvalid);
    if (!f.password) return setError(t.passwordRequired);
    if (f.password.length < 6) return setError(t.passwordShort);
    if (needsManager && !f.manager_id) return setError(t.managerRequired);

    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'create',
          org_id: member.org_id,
          full_name: f.full_name.trim(),
          email: f.email.trim(),
          password: f.password,
          phone: f.phone.trim() || null,
          phone2: f.phone2.trim() || null,
          role: f.role,
          manager_id: showManager ? f.manager_id : null,
          gender: f.gender,
        },
      });

      if (resp.error) throw resp.error;
      const body = resp.data;
      if (body?.error) {
        if (body.error === 'email_exists') {
          setError(he.team.emailExists);
        } else {
          setError(he.team.createError);
        }
        setBusy(false);
        return;
      }

      onCreated({ email: f.email.trim(), password: f.password });
    } catch {
      setError(he.team.createError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t.fullName} value={f.full_name} onChange={set('full_name')} />
      <Field label={t.email} type="email" inputMode="email" value={f.email} onChange={set('email')} />
      <Field label={t.password} type="text" value={f.password} onChange={set('password')} autoComplete="off" />
      <p className="!mt-1 text-xs text-grayMid">{t.passwordHint}</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t.phone} ${he.common.optional}`} type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} />
        <Field label={`${t.phone2} ${he.common.optional}`} type="tel" inputMode="tel" value={f.phone2} onChange={set('phone2')} />
      </div>

      <Field
        label={t.role}
        as="select"
        value={f.role}
        onChange={set('role')}
        options={ROLES}
      />

      {showManager && (
        <div>
          <p className="mb-1 text-sm font-bold text-inkSoft">
            {t.manager} {needsManager ? '' : he.common.optional}
          </p>
          <ManagerPicker
            managers={managers}
            value={f.manager_id}
            onChange={set('manager_id')}
            multiple={false}
          />
        </div>
      )}

      <div className="flex gap-3">
        <Field label={t.gender} as="select" value={f.gender} onChange={set('gender')} options={[
          { value: 'm', label: t.genderM },
          { value: 'f', label: t.genderF },
        ]} />
      </div>

      {error && (
        <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>
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
