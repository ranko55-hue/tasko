import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ymd } from '../lib/calendar';

const COLS =
  'id, title, status, priority, assignee_id, starts_on, start_time, ends_on, ' +
  'due_time, due_at, scheduled_start_at, created_at, est_minutes, ' +
  'client:clients(name), project:projects(name)';

// משימות החופפות לטווח — שאילתה יעילה לטווח בלבד + realtime על שינויי משימות
// (כמו הלוח). חפיפה: המשימה מסתיימת אחרי תחילת הטווח ומתחילה לפני סופו.
export function useTasksTimeline(orgId, rangeStart, rangeEnd) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const rsISO = rangeStart.toISOString();
  const reDate = ymd(rangeEnd);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select(COLS)
      .eq('org_id', orgId)
      .is('archived_at', null)
      .gte('due_at', rsISO)
      .or(`starts_on.lte.${reDate},starts_on.is.null`);
    setTasks(data ?? []);
    setLoading(false);
  }, [orgId, rsISO, reDate]);

  useEffect(() => {
    load();
    if (!orgId) return;
    const channel = supabase
      .channel('timeline-' + orgId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orgId, load]);

  return { tasks, loading, refetch: load };
}
