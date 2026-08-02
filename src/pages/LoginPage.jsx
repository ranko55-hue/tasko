import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';

const t = he.auth;

// מסך התחברות + הרשמה מול Supabase Auth
export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isSignup = mode === 'signup';

  function validate() {
    if (!email.trim()) return t.errors.emailRequired;
    if (!password) return t.errors.passwordRequired;
    if (isSignup && password.length < 6) return t.errors.passwordShort;
    return '';
  }

  function mapAuthError(message) {
    const m = (message || '').toLowerCase();
    if (m.includes('invalid login')) return t.errors.invalid_credentials;
    if (m.includes('already registered') || m.includes('already exists'))
      return t.errors.email_exists;
    return t.errors.generic;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    const v = validate();
    if (v) return setError(v);

    setBusy(true);
    try {
      if (isSignup) {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setNotice(t.signupSuccess);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        // הצלחה — useAuth יזהה את ה-session וינווט הלאה
      }
    } catch (err) {
      setError(mapAuthError(err.message));
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
    setNotice('');
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img
            src="/brand/tasko-header-light.png"
            alt={he.app.name}
            className="mx-auto h-10 w-auto"
          />
          <p className="mt-3 text-slate-500">{he.app.tagline}</p>
        </div>

        <Card className="p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-extrabold text-slate-900">
            {isSignup ? t.signupTitle : t.loginTitle}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label={t.email}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              inputMode="email"
            />
            <Field
              label={t.password}
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {notice}
              </p>
            )}

            <Button type="submit" disabled={busy}>
              {busy
                ? he.common.loading
                : isSignup
                  ? t.signupButton
                  : t.loginButton}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button variant="link" fullWidth={false} onClick={toggleMode}>
              {isSignup ? t.switchToLogin : t.switchToSignup}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
