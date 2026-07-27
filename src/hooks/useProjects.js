import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// פרויקטים של לקוח + הוספה
export function useProjects(clientId, orgId) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addProject(fields) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ org_id: orgId, client_id: clientId, ...fields })
      .select()
      .single();
    if (error) throw error;
    setProjects((prev) => [data, ...prev]);
    return data;
  }

  return { projects, loading, addProject, refetch: load };
}

// פרויקט בודד (כולל שם הלקוח) — לכותרת ולניווט חזרה
export function useProject(projectId) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    supabase
      .from('projects')
      .select('*, client:clients(id, name)')
      .eq('id', projectId)
      .maybeSingle()
      .then(({ data }) => {
        setProject(data ?? null);
        setLoading(false);
      });
  }, [projectId]);

  return { project, loading };
}
