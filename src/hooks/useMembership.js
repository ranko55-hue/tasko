import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// בודק אם למשתמש המחובר יש כבר חברות בארגון.
// member === null (ו-loading=false) → צריך לעבור לאשף הקמת ארגון.
export function useMembership(userId) {
  const [member, setMember] = useState(null);
  const [resolvedFor, setResolvedFor] = useState(null); // המשתמש ש-member משקף
  const [fetching, setFetching] = useState(false);

  const fetchMember = useCallback(async () => {
    if (!userId) {
      setMember(null);
      setResolvedFor(null);
      return;
    }
    setFetching(true);
    const { data } = await supabase
      .from('org_members')
      .select('id, org_id, full_name, role, gender')
      .eq('auth_user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    setMember(data ?? null);
    setResolvedFor(userId);
    setFetching(false);
  }, [userId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  // "טוען" = יש משתמש אך החברות עוד לא נפתרה עבורו (מונע רינדור עם member=null בטעות)
  const loading = Boolean(userId) && (fetching || resolvedFor !== userId);

  return {
    member: resolvedFor === userId ? member : null,
    loading,
    refetch: fetchMember,
  };
}
