import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const CLOSED = ['done', 'cancelled'];

// כל נתוני מסך הלקוח: פרויקטים, משימות (דרך הפרויקטים), ומסמכי כספים.
export function useClientDetail(clientId, orgId) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const { data: pr, error: pe } = await supabase
        .from('projects')
        .select('id, name, status, address')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (pe) throw pe;

      const projIds = (pr ?? []).map((p) => p.id);
      let tk = [];
      if (projIds.length) {
        const { data, error: te } = await supabase
          .from('tasks')
          .select('id, title, status, assignee_id, project_id')
          .in('project_id', projIds)
          .order('created_at', { ascending: false });
        if (te) throw te;
        tk = data ?? [];
      }

      const { data: docs } = await supabase
        .from('client_documents')
        .select('id, kind, title, amount, status')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      setProjects(pr ?? []);
      setTasks(tk);
      setDocuments(docs ?? []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addProject(fields) {
    const { data, error: e } = await supabase
      .from('projects')
      .insert({ org_id: orgId, client_id: clientId, ...fields })
      .select('id, name, status, address')
      .single();
    if (e) throw e;
    setProjects((p) => [data, ...p]);
    return data;
  }

  async function addDocument(fields) {
    const { data, error: e } = await supabase
      .from('client_documents')
      .insert({ org_id: orgId, client_id: clientId, ...fields })
      .select('id, kind, title, amount, status')
      .single();
    if (e) throw e;
    setDocuments((d) => [data, ...d]);
    return data;
  }

  // ספירת משימות פתוחות לכל פרויקט (לתג "פעיל · N משימות")
  const openTaskCountByProject = {};
  tasks.forEach((t) => {
    if (!CLOSED.includes(t.status))
      openTaskCountByProject[t.project_id] =
        (openTaskCountByProject[t.project_id] || 0) + 1;
  });

  const openProjectCount = projects.filter((p) => p.status === 'open').length;
  const openTaskCount = tasks.filter((t) => !CLOSED.includes(t.status)).length;

  return {
    projects,
    tasks,
    documents,
    loading,
    error,
    addProject,
    addDocument,
    openTaskCountByProject,
    openProjectCount,
    openTaskCount,
    refetch: load,
  };
}
