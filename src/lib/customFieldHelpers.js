import { supabase } from './supabase';

export async function saveCustomValues(orgId, entityType, entityId, valuesMap) {
  const rows = Object.entries(valuesMap)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([fieldId, value]) => ({
      org_id: orgId,
      field_id: fieldId,
      entity_type: entityType,
      entity_id: String(entityId),
      value: value || null,
    }));

  if (!rows.length) return;

  const { error } = await supabase
    .from('custom_field_values')
    .upsert(rows, { onConflict: 'field_id,entity_id' });

  if (error) console.error('saveCustomValues', error.message);
}

export function splitCustomValues(fields) {
  const { _customValues, ...taskFields } = fields;
  return { taskFields, customValues: _customValues || {} };
}
