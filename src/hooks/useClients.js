import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// רשימת הלקוחות של הארגון + הוספה
export function useClients(orgId) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addClient(fields) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ org_id: orgId, ...fields })
      .select()
      .single();
    if (error) throw error;
    setClients((prev) => [data, ...prev]);
    return data;
  }

  return { clients, loading, addClient, refetch: load };
}

// לקוח בודד לפי מזהה
export function useClient(clientId) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    setLoading(true);
    supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle()
      .then(({ data }) => {
        setClient(data ?? null);
        setLoading(false);
      });
  }, [clientId]);

  return { client, loading };
}
