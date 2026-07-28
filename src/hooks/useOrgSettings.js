import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// הגדרות הארגון (אפיון v8 §3.9). כתיבה מוגנת ב-policy org_update — מנהלים בלבד.
export function useOrgSettings(orgId) {
  const [settings, setSettings] = useState({ require_project: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('organizations')
      .select('require_project')
      .eq('id', orgId)
      .single();

    if (err) {
      console.error('useOrgSettings[load]', err.code ?? '', err.message);
      setError(true);
    } else {
      setSettings({ require_project: Boolean(data?.require_project) });
      setError(false);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  // Optimistic: מציגים מיד, מחזירים לאחור אם השמירה נכשלה
  async function update(patch) {
    const previous = settings;
    setSettings((s) => ({ ...s, ...patch }));
    setSaving(true);
    setError(false);

    const { error: err } = await supabase
      .from('organizations')
      .update(patch)
      .eq('id', orgId);

    setSaving(false);
    if (err) {
      console.error('useOrgSettings[update]', err.code ?? '', err.message);
      setSettings(previous);
      setError(true);
      return false;
    }
    return true;
  }

  return { settings, loading, saving, error, update, refetch: load };
}
