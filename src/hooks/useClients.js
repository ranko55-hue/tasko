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

  // managerIds — הקצאת הלקוח למנהלים (מיגרציה 015). ריק = ללא הקצאה,
  // כלומר רק admin יראה אותו.
  async function addClient(fields, managerIds = []) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ org_id: orgId, ...fields })
      .select()
      .single();
    if (error) throw error;

    if (managerIds.length) {
      const rows = managerIds.map((member_id) => ({
        client_id: data.id,
        member_id,
        org_id: orgId,
      }));
      const { error: assignErr } = await supabase.from('client_managers').insert(rows);
      // הלקוח כבר נוצר; כשל הקצאה לא מוחק אותו אלא מדווח כלפי מעלה
      if (assignErr) throw assignErr;
    }

    setClients((prev) => [data, ...prev]);
    return data;
  }

  return { clients, loading, addClient, refetch: load };
}

// לקוח בודד לפי מזהה
export function useClient(clientId) {
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .maybeSingle();
    setClient(data ?? null);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  // עדכון פרטי הלקוח — RLS מאכפת שרק מנהל של הלקוח רשאי. מחזיר את השורה המעודכנת.
  async function updateClient(patch) {
    const { data, error } = await supabase
      .from('clients')
      .update(patch)
      .eq('id', clientId)
      .select()
      .single();
    if (error) throw error;
    setClient(data);
    return data;
  }

  return { client, loading, refetch: load, updateClient };
}
