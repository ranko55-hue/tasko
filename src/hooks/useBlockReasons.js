import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// סיבת העיכוב האחרונה לכל משימה חסומה — למסך המנהל
export function useBlockReasons(tasks) {
  const blockedIds = tasks.filter((t) => t.status === 'blocked').map((t) => t.id);
  const key = blockedIds.join(',');
  const [reasons, setReasons] = useState({});

  useEffect(() => {
    if (!blockedIds.length) {
      setReasons({});
      return;
    }
    supabase
      .from('task_events')
      .select('task_id, payload, created_at')
      .in('task_id', blockedIds)
      .eq('type', 'blocked')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const map = {};
        (data ?? []).forEach((e) => {
          if (!(e.task_id in map)) map[e.task_id] = e.payload?.text ?? '';
        });
        setReasons(map);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return reasons;
}
