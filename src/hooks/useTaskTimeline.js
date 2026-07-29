import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { withSignedUrls } from '../lib/media';

// ציר הזמן של משימה — כל האירועים, עם כתובות חתומות לתמונות/שמע.
export function useTaskTimeline(taskId, refreshKey = 0) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data, error: e } = await supabase
      .from('task_events')
      .select('id, type, payload, created_at, actor_id, actor:org_members(full_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (e) {
      setError(true);
      setLoading(false);
      return;
    }
    setEvents(await withSignedUrls(data));
    setError(false);
    setLoading(false);
  }, [taskId, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, refetch: load };
}
