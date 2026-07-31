import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEmployeeEvaluations(memberId, orgId) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!memberId || !orgId) return;
    setLoading(true);

    const { data } = await supabase
      .from('employee_evaluations')
      .select('id, rating, body, created_at, author:org_members!employee_evaluations_author_id_fkey(full_name)')
      .eq('member_id', memberId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    setEvaluations(data ?? []);
    setLoading(false);
  }, [memberId, orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addEvaluation(rating, body) {
    const { error } = await supabase.from('employee_evaluations').insert({
      org_id: orgId,
      member_id: memberId,
      author_id: (await supabase.from('org_members').select('id').eq('auth_user_id', (await supabase.auth.getUser()).data.user.id).eq('org_id', orgId).single()).data.id,
      rating,
      body,
    });
    if (error) throw error;
    await fetch();
  }

  return { evaluations, loading, addEvaluation, refetch: fetch };
}
