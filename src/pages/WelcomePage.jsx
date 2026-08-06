import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Card from '../components/ui/Card';
import Field from '../components/ui/Field';

const t = he.welcome;

// דף ציבורי — קבלת הזמנת עובד. מחוץ לשומר הסשן: המבקר עדיין לא מחובר.
export default function WelcomePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null); // { full_name, org_name, valid }
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('invite_info', { p_token: token });
      setInfo(data?.[0] ?? null);
      setLoading(false);
    })();
  }, [token]);

  function mapErr(code) {
    if (code === 'expired' || code === 'invalid_token') return t.invalid;
    if (code === 'already_used' || code === 'already_active') return t.used;
    if (code === 'password_too_short') return t.short;
    return t.error;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError(t.short);
    if (password !== confirm) return setError(t.mismatch);

    setBusy(true);
    try {
      const resp = await supabase.functions.invoke('accept-invite', {
        body: { token, password },
      });
      if (resp.error) throw resp.error;
      if (resp.data?.error) {
        setError(mapErr(resp.data.error));
        setBusy(false);
        return;
      }
      // הצלחה — התחברות מיידית עם המזהה שהוחזר, ואז /my
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: resp.data.login_email,
        password,
      });
      if (signErr) throw signErr;
      navigate('/my', { replace: true });
    } catch {
      setError(t.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <img src="/brand/tasko-header-light.png" alt={he.app.name} className="mx-auto h-10 w-auto" />
        </div>

        <Card className="p-6 sm:p-8">
          {loading ? (
            <p className="py-8 text-center text-grayMid">{t.loading}</p>
          ) : !info || !info.valid ? (
            <div className="py-6 text-center">
              <p className="text-lg font-bold text-navy">{t.invalidTitle}</p>
              <p className="mt-2 text-sm text-grayMid">{t.invalid}</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-navy">
                {t.greeting.replace('{name}', info.full_name)}
              </h2>
              <p className="mt-1 text-grayMid">{t.subtitle.replace('{org}', info.org_name)}</p>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <p className="text-sm font-bold text-inkSoft">{t.setPassword}</p>
                <Field label={t.password} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
                <Field label={t.passwordConfirm} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

                {error && (
                  <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>
                )}

                <Button type="submit" disabled={busy}>
                  {busy ? he.common.loading : t.submit}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
