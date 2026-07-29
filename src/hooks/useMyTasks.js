import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const COLS =
  'id, org_id, title, description, address, status, priority, due_at, ' +
  'scheduled_start_at, est_minutes, requirements, required_workers, ' +
  'starts_on, ends_on, due_time, ' +
  'team_lead_id, assignee_id, net_seconds, work_started_at, ' +
  'client:clients(name), project:projects(name)';

// "המשימות שלי" — משימות שאני assignee או team_lead שלהן
export function useMyTasks(memberId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select(COLS)
      .or(`assignee_id.eq.${memberId},team_lead_id.eq.${memberId}`)
      .order('due_at', { ascending: true, nullsFirst: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  // עדכון מקומי אחרי מעבר סטטוס — שומר על שדות מקוננים (project)
  function applyLocal(updated) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
  }

  return { tasks, loading, applyLocal, refetch: load };
}
