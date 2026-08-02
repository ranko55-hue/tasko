import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { useOrgManagers } from '../../hooks/useOrgManagers';
import { isAdmin } from '../../lib/roles';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import Field from '../ui/Field';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ManagerPicker from '../shared/ManagerPicker';

const t = he.team.detail;
const ROLES = [
  { value: 'worker', label: he.roles.worker },
  { value: 'manager', label: he.roles.manager },
  { value: 'admin', label: he.roles.admin },
];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export default function MemberDetailsTab({ member, canEdit, onRefresh }) {
  const { member: me } = useOrg();
  const { managers } = useOrgManagers(me?.org_id);
  const admin = isAdmin(me);

  const [f, setF] = useState({
    full_name: member.full_name,
    phone: member.phone || '',
    phone2: member.phone2 || '',
    email: member.email || '',
    role: member.role,
    manager_id: member.manager_id,
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roleConfirm, setRoleConfirm] = useState(null);
  const [resetModal, setResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [toggleBusy, setToggleBusy] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState(false);

  const set = (k) => (v) => {
    if (k === 'role' && v !== f.role) {
      setRoleConfirm(v);
      return;
    }
    setF((s) => ({ ...s, [k]: v }));
    setDirty(true);
  };

  function confirmRole() {
    setF((s) => ({ ...s, role: roleConfirm }));
    setDirty(true);
    setRoleConfirm(null);
  }

  async function save() {
    setError('');
    setSaving(true);
    const { error: err } = await supabase
      .from('org_members')
      .update({
        full_name: f.full_name.trim(),
        phone: f.phone.trim() || null,
        phone2: f.phone2.trim() || null,
        email: f.email.trim() || null,
        role: f.role,
        manager_id: f.role === 'admin' ? null : f.manager_id,
      })
      .eq('id', member.id);
    if (err) {
      setError(he.common.saveError);
    } else {
      setDirty(false);
      onRefresh();
    }
    setSaving(false);
  }

  async function resetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) return;
    setResetBusy(true);
    try {
      const resp = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'reset_password',
          org_id: me.org_id,
          member_id: member.id,
          new_password: newPassword,
        },
      });
      if (resp.error || resp.data?.error) throw new Error();
      setResetResult(newPassword);
      setNewPassword('');
    } catch {
      setError(t.resetError);
    }
    setResetBusy(false);
  }

  async function toggleActive() {
    setToggleBusy(true);
    try {
      const resp = await supabase.functions.invoke('manage-member', {
        body: {
          action: 'toggle_active',
          org_id: me.org_id,
          member_id: member.id,
          is_active: !member.is_active,
        },
      });
      if (resp.error || resp.data?.error) {
        if (resp.data?.error === 'last_admin') {
          setError(t.lastAdmin);
        } else {
          setError(member.is_active ? t.deactivateError : t.reactivateError);
        }
      } else {
        onRefresh();
      }
    } catch {
      setError(member.is_active ? t.deactivateError : t.reactivateError);
    }
    setToggleBusy(false);
    setToggleConfirm(false);
  }

  const showManager = f.role !== 'admin';

  return (
    <div className="space-y-6">
      <Field label={t.fullName} value={f.full_name} onChange={set('full_name')} />

      <div className="grid grid-cols-2 gap-3">
        <Field label={`${t.phone} ${he.common.optional}`} type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} />
        <Field label={`${t.phone2} ${he.common.optional}`} type="tel" inputMode="tel" value={f.phone2} onChange={set('phone2')} />
      </div>

      <Field label={t.email} value={f.email} onChange={canEdit ? set('email') : undefined} />

      {admin && (
        <Field label={t.role} as="select" value={f.role} onChange={set('role')} options={ROLES} />
      )}

      {showManager && canEdit && (
        <div>
          <p className="mb-1 text-sm font-bold text-inkSoft">{t.manager}</p>
          <ManagerPicker
            managers={managers.filter((m) => m.id !== member.id)}
            value={f.manager_id}
            onChange={(v) => { setF((s) => ({ ...s, manager_id: v })); setDirty(true); }}
            multiple={false}
          />
        </div>
      )}

      <p className="text-sm text-grayMid">
        {t.joined}: {fmtDate(member.created_at)}
      </p>

      {error && (
        <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>
      )}

      {dirty && canEdit && (
        <div className="flex gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? he.common.loading : he.common.save}
          </Button>
        </div>
      )}

      {/* כניסה למערכת */}
      {admin && (
        <div className="border-t border-line pt-4">
          <p className="mb-1 text-sm font-bold text-inkSoft">{t.login}</p>
          <p className="mb-3 text-sm text-grayMid" dir="ltr">{member.email || '—'}</p>
          <div className="w-48">
            <Button variant="secondary" onClick={() => setResetModal(true)}>{t.resetPassword}</Button>
          </div>
        </div>
      )}

      {/* השבתה / הפעלה */}
      {admin && member.id !== me.id && (
        <div className="border-t border-line pt-4">
          {member.is_active ? (
            <div className="w-48">
              <Button variant="danger" onClick={() => setToggleConfirm(true)}>
                {t.deactivate}
              </Button>
            </div>
          ) : (
            <div className="w-48">
              <Button variant="outline" onClick={() => setToggleConfirm(true)}>
                {t.reactivate}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* שינוי תפקיד — אישור */}
      {roleConfirm && (
        <Modal title={t.roleChangeTitle} onClose={() => setRoleConfirm(null)}>
          <p className="mb-4 text-sm text-inkSoft">{t.roleChangeConfirm}</p>
          <div className="flex gap-3">
            <Button onClick={confirmRole}>{he.common.save}</Button>
            <Button variant="ghost" onClick={() => setRoleConfirm(null)}>{he.common.cancel}</Button>
          </div>
        </Modal>
      )}

      {/* איפוס סיסמה */}
      {resetModal && (
        <Modal title={t.resetPasswordTitle} onClose={() => { setResetModal(false); setResetResult(null); }}>
          {resetResult ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800">{t.resetSuccess}</p>
              <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <span className="text-sm font-bold" dir="ltr">{resetResult}</span>
                <Button variant="ghost" size="sm" fullWidth={false} onClick={() => { navigator.clipboard.writeText(resetResult); }}>
                  {he.team.credentials.copy}
                </Button>
              </div>
              <Button onClick={() => { setResetModal(false); setResetResult(null); }}>
                {he.team.credentials.close}
              </Button>
            </div>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <p className="text-sm text-grayMid">{t.resetPasswordHint}</p>
              <Field label={t.newPassword} type="text" value={newPassword} onChange={setNewPassword} autoComplete="off" />
              <div className="flex gap-3">
                <Button type="submit" disabled={resetBusy || newPassword.length < 6}>
                  {resetBusy ? he.common.loading : he.common.save}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setResetModal(false)}>
                  {he.common.cancel}
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* אישור השבתה/הפעלה */}
      {toggleConfirm && (
        <Modal
          title={member.is_active ? t.deactivate : t.reactivate}
          onClose={() => setToggleConfirm(false)}
        >
          <p className="mb-4 text-sm text-inkSoft">
            {member.is_active ? t.deactivateConfirm : t.reactivateConfirm}
          </p>
          <div className="flex gap-3">
            <Button
              variant={member.is_active ? 'danger' : 'primary'}
              onClick={toggleActive}
              disabled={toggleBusy}
            >
              {toggleBusy ? he.common.loading : (member.is_active ? t.deactivate : t.reactivate)}
            </Button>
            <Button variant="ghost" onClick={() => setToggleConfirm(false)}>
              {he.common.cancel}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
