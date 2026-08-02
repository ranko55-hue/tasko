import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useCustomFieldValues(orgId, entityType, entityId) {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId || !entityId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('custom_field_values')
      .select('field_id, value')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', String(entityId));

    if (error) console.error('useCustomFieldValues', error.message);
    else {
      const map = {};
      (data ?? []).forEach((r) => { map[r.field_id] = r.value; });
      setValues(map);
    }
    setLoading(false);
  }, [orgId, entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  async function saveValues(fieldMap) {
    const rows = Object.entries(fieldMap)
      .filter(([, v]) => v !== undefined)
      .map(([fieldId, value]) => ({
        org_id: orgId,
        field_id: fieldId,
        entity_type: entityType,
        entity_id: String(entityId),
        value: value === '' ? null : value,
      }));

    if (!rows.length) return;

    const { error } = await supabase
      .from('custom_field_values')
      .upsert(rows, { onConflict: 'field_id,entity_id' });

    if (error) throw error;
    await load();
  }

  return { values, loading, refetch: load, saveValues };
}
