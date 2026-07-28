import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// משימה בודדת + כל הפרטים שלה (דרישות, ציר זמן, פרויקט, משויך)
export function useTaskDetail(taskId) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(!!taskId);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .select(
          `
          id, title, description, address, priority, status, due_at, scheduled_start_at,
          est_minutes, requirements, required_workers, net_seconds, work_started_at,
          assignee_id, created_by, team_lead_id, project_id, org_id,
          project:projects(id, name, client_id, clients(id, name))
        `
        )
        .eq('id', taskId)
        .single();
      if (err) throw err;
      setTask(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateTask(updates) {
    if (!task) return;
    try {
      const { data, error: err } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();
      if (err) throw err;
      setTask(data);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }

  return { task, loading, error, refetch: load, updateTask };
}
