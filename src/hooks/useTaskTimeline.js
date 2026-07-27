import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signedUrl } from '../lib/media';

// ציר הזמן של משימה — כל האירועים, עם כתובות חתומות לתמונות/שמע.
export function useTaskTimeline(taskId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data, error: e } = await supabase
      .from('task_events')
      .select('id, type, payload, created_at, actor_id')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });
    if (e) {
      setError(true);
      setLoading(false);
      return;
    }
    const withUrls = await Promise.all(
      (data ?? []).map(async (ev) => {
        if (
          (ev.type === 'photo' || ev.type === 'voice_note') &&
          ev.payload?.path
        ) {
          try {
            ev.url = await signedUrl(ev.payload.path);
          } catch {
            ev.url = null;
          }
        }
        return ev;
      })
    );
    setEvents(withUrls);
    setError(false);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, refetch: load };
}
