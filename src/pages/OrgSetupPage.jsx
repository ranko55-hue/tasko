import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import TextField from '../components/shared/TextField';

const t = he.setup;

// אשף הקמת ארגון — למשתמש מחובר שאין לו עדיין ארגון.
// היצירה אטומית דרך RPC create_organization (ראו 000_init_v7.sql).
export default function OrgSetupPage({ onCreated }) {
  const [orgName, setOrgName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('m'); // ברירת מחדל: זכר
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    if (!orgName.trim()) return t.errors.orgNameRequired;
    if (!fullName.trim()) return t.errors.fullNameRequired;
    return '';
  }

  function mapRpcError(message) {
    const m = message || '';
    if (m.includes('not_authenticated')) return t.errors.not_authenticated;
    if (m.includes('invalid_org_name')) return t.errors.invalid_org_name;
    if (m.includes('already_member')) return t.errors.already_member;
    return t.errors.generic;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) return setError(v);

    setBusy(true);
    try {
      const { error: err } = await supabase.rpc('create_organization', {
        p_org_name: orgName,
        p_full_name: fullName,
        p_phone: phone || null,
        p_gender: gender,
      });
      if (err) throw err;
      // הצלחה — נטען מחדש את החברות וננווט למסך הבית
      onCreated?.();
    } catch (err) {
      setError(mapRpcError(err.message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card title={t.title} subtitle={t.subtitle}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            label={t.orgName}
            value={orgName}
            onChange={setOrgName}
            placeholder={t.orgNamePlaceholder}
          />
          <TextField
            label={t.fullName}
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
          />
          <TextField
            label={t.phone}
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder={t.phonePlaceholder}
            autoComplete="tel"
            inputMode="tel"
          />

          <fieldset>
            <legend className="mb-1.5 block text-base font-medium text-slate-700">
              {t.gender}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <GenderOption
                value="m"
                current={gender}
                onSelect={setGender}
                label={t.genderMale}
              />
              <GenderOption
                value="f"
                current={gender}
                onSelect={setGender}
                label={t.genderFemale}
              />
            </div>
          </fieldset>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? he.common.loading : t.submit}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// כפתור בחירת מין — יעד מגע גדול (min-h-touch)
function GenderOption({ value, current, onSelect, label }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={
        'min-h-touch rounded-xl border px-4 text-lg font-medium transition-colors ' +
        (active
          ? 'border-brand bg-brand text-white'
          : 'border-slate-300 bg-white text-slate-700 hover:border-brand')
      }
    >
      {label}
    </button>
  );
}
