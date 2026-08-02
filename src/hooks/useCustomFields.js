import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCustomFields(orgId, entity) {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) { setLoading(false); return; }
    const q = supabase
      .from('custom_field_defs')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('sort_order');

    if (entity) q.eq('entity', entity);

    const { data, error } = await q;
    if (error) console.error('useCustomFields', error.message);
    else setFields(data ?? []);
    setLoading(false);
  }, [orgId, entity]);

  useEffect(() => { load(); }, [load]);

  async function createField(field) {
    const { data, error } = await supabase
      .from('custom_field_defs')
      .insert({ org_id: orgId, ...field })
      .select()
      .single();
    if (error) throw error;
    await load();
    return data;
  }

  async function updateField(id, patch) {
    const { error } = await supabase
      .from('custom_field_defs')
      .update(patch)
      .eq('id', id);
    if (error) throw error;
    await load();
  }

  async function deleteField(id) {
    const { error } = await supabase
      .from('custom_field_defs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await load();
  }

  return { fields, loading, refetch: load, createField, updateField, deleteField };
}
