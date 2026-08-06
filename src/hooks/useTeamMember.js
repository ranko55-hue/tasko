import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTeamMember(memberId, orgId) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!memberId || !orgId) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('org_members')
      .select('id, full_name, email, phone, phone2, role, gender, manager_id, is_active, auth_user_id, created_at')
      .eq('id', memberId)
      .eq('org_id', orgId)
      .single();

    if (err) {
      setError(err);
    } else {
      setMember(data);
    }
    setLoading(false);
  }, [memberId, orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { member, loading, error, refetch: fetch };
}
