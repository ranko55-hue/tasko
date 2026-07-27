import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// בודק אם למשתמש המחובר יש כבר חברות בארגון.
// member === null → צריך לעבור לאשף הקמת ארגון.
export function useMembership(userId) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMember = useCallback(async () => {
    if (!userId) {
      setMember(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('org_members')
      .select('id, org_id, full_name, role, gender')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    setMember(data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, loading, refetch: fetchMember };
}
