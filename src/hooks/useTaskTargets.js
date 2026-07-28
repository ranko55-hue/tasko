import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// יעדי המשימה (אפיון v8 §3.4): לקוחות + פרויקטים של הארגון,
// והגדרת require_project (§3.9) שקובעת אם הפרויקט חובה ביצירה.
export function useTaskTargets(orgId) {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [requireProject, setRequireProject] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const [cRes, pRes, oRes] = await Promise.all([
      supabase
        .from('clients')
        .select('id, name')
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('name', { ascending: true }),
      supabase
        .from('projects')
        .select('id, name, client_id')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }),
      supabase.from('organizations').select('require_project').eq('id', orgId).single(),
    ]);

    if (cRes.error) console.error('useTaskTargets[clients]', cRes.error.message);
    else setClients(cRes.data ?? []);

    if (pRes.error) console.error('useTaskTargets[projects]', pRes.error.message);
    else setProjects(pRes.data ?? []);

    if (oRes.error) console.error('useTaskTargets[org]', oRes.error.message);
    else setRequireProject(Boolean(oRes.data?.require_project));

    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  // "לקוח מהיר" — יוצר לקוח ומחזיר אותו כדי שהטופס יבחר אותו מיד
  async function quickCreateClient(fields) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ org_id: orgId, ...fields })
      .select('id, name')
      .single();
    if (error) throw error;
    setClients((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name, 'he')));
    return data;
  }

  return { clients, projects, requireProject, loading, quickCreateClient, refetch: load };
}
