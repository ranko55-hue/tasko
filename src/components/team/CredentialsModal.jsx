import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';

const t = he.team.credentials;

export default function CredentialsModal({ email, password, onClose }) {
  const [copiedField, setCopiedField] = useState(null);

  function copy(text, field) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-green-50 p-4">
        <p className="mb-3 text-sm font-bold text-green-800">{he.team.createSuccess}</p>
        <p className="text-xs text-green-700">{t.hint}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-xs font-medium text-grayMid">{t.email}</p>
            <p className="text-sm font-bold text-navy" dir="ltr">{email}</p>
          </div>
          <Button variant="ghost" size="sm" fullWidth={false} onClick={() => copy(email, 'email')}>
            {copiedField === 'email' ? t.copied : t.copy}
          </Button>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
          <div>
            <p className="text-xs font-medium text-grayMid">{t.password}</p>
            <p className="text-sm font-bold text-navy" dir="ltr">{password}</p>
          </div>
          <Button variant="ghost" size="sm" fullWidth={false} onClick={() => copy(password, 'password')}>
            {copiedField === 'password' ? t.copied : t.copy}
          </Button>
        </div>
      </div>

      <Button onClick={onClose}>{t.close}</Button>
    </div>
  );
}
