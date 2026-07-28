import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// משימה בודדת — טעינת כל אירועיה
export function useTaskEvents(taskId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(!!taskId);

  const load = useCallback(async () => {
    if (!taskId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('task_events')
        .select('id, type, payload, created_at, actor_id, actor:org_members(full_name)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      setEvents(data || []);
    } catch (err) {
      console.error('Task events fetch error:', err);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, refetch: load };
}
