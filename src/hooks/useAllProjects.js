import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SELECT = 'id, number, name, sku, address, ends_at, status, created_at, client:clients(id, name)';

export function useAllProjects(orgId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select(SELECT)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  return { projects, loading, refetch: load };
}
