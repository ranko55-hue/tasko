import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// משימות של פרויקט + פתיחת משימה חדשה.
// משימה נוצרת תמיד תחת פרויקט (project_id חובה) — ראו CONVENTIONS ואפיון.
export function useTasks(projectId, orgId, createdBy) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('id, org_id, title, status, priority, due_at, assignee_id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTask(fields) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        org_id: orgId,
        project_id: projectId,
        created_by: createdBy,
        ...fields,
      })
      .select('id, org_id, title, status, priority, due_at, assignee_id')
      .single();
    if (error) throw error;
    setTasks((prev) => [data, ...prev]);
    return data;
  }

  // עדכון מקומי אחרי מעבר סטטוס (למשל החזרת משימה חסומה לעבודה)
  function applyLocal(updated) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
    );
  }

  return { tasks, loading, addTask, applyLocal, refetch: load };
}
