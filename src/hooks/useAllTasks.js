import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ASSIGNEE = 'assignee:org_members!tasks_assignee_id_fkey(full_name)';
const CLIENT = 'client:clients(name)';
const PROJECT = 'project:projects(name)';
const SELECT = `id, title, status, priority, assignee_id, created_at, starts_on, ends_on, ${ASSIGNEE}, ${CLIENT}, ${PROJECT}`;

export function useAllTasks(orgId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select(SELECT)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  return { tasks, loading, refetch: load };
}
