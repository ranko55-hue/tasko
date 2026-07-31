import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMemberTasks(memberId, orgId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!memberId || !orgId) return;
    setLoading(true);

    const { data } = await supabase
      .from('tasks')
      .select(`
        id, title, status, priority, due_at, net_seconds, created_at,
        client:clients(id, name),
        project:projects(id, name)
      `)
      .eq('org_id', orgId)
      .eq('assignee_id', memberId)
      .order('created_at', { ascending: false });

    setTasks(data ?? []);
    setLoading(false);
  }, [memberId, orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { tasks, loading, refetch: fetch };
}
