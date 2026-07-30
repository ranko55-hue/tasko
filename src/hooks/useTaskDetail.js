import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// הלקוח הוא העוגן (v8 §3.4) — client תמיד קיים, project עשוי להיות null.
const SELECT = `
  id, title, description, address, priority, status, due_at, scheduled_start_at,
  est_minutes, requirements, required_workers, net_seconds, work_started_at,
  starts_on, ends_on, due_time,
  assignee_id, created_by, team_lead_id, client_id, project_id, org_id,
  client:clients(id, number, name),
  project:projects(id, number, name, client_id, sku, address)
`;

// משימה בודדת + כל הפרטים שלה (דרישות, לקוח, פרויקט, משויך)
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

    const { data, error: err } = await supabase
      .from('tasks')
      .select(SELECT)
      .eq('id', taskId)
      .single();

    if (err) {
      console.error('useTaskDetail[load]', err.code ?? '', err.message);
      setError(err.message);
    } else {
      setTask(data);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  // שמירת עריכה. הטריגר בשרת אוכף הרשאת מנהל ורושם אירוע 'edited',
  // ולכן שגיאה מכאן היא מקור האמת — לא בודקים תפקיד בלקוח בלבד.
  async function updateTask(updates) {
    if (!taskId) return null;

    const { error: err } = await supabase.from('tasks').update(updates).eq('id', taskId);
    if (err) {
      console.error('useTaskDetail[update]', err.code ?? '', err.message);
      throw err;
    }
    await load(); // מרענן כדי לקבל את הלקוח/פרויקט המקושרים מחדש
    return true;
  }

  // ביטול משימה — RPC שאוכף סיבה חובה והרשאת מנהל בצד שרת
  async function cancelTask(reason) {
    const { error: err } = await supabase.rpc('cancel_task', {
      p_task_id: taskId,
      p_reason: reason,
    });
    if (err) {
      console.error('useTaskDetail[cancel]', err.code ?? '', err.message);
      throw err;
    }
    await load();
    return true;
  }

  return { task, loading, error, refetch: load, updateTask, cancelTask };
}
