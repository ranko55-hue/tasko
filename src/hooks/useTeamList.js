import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTeamList(orgId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('org_members')
      .select('id, full_name, email, phone, role, manager_id, is_active, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    if (err) {
      setError(err);
    } else {
      setMembers(data ?? []);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { members, loading, error, refetch: fetch };
}
