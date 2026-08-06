import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// תבניות וואטסאפ + חתימה לארגון. כתיבה מותרת ל-admin בלבד (נאכף ב-RLS).
export function useWaTemplates(orgId) {
  const [templates, setTemplates] = useState([]);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [{ data: tpls }, { data: st }] = await Promise.all([
      supabase.from('wa_templates').select('*').eq('org_id', orgId)
        .order('sort_order').order('created_at'),
      supabase.from('wa_settings').select('signature').eq('org_id', orgId).maybeSingle(),
    ]);
    setTemplates(tpls ?? []);
    setSignature(st?.signature ?? '');
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  async function addTemplate({ title, body }) {
    const { data, error } = await supabase.from('wa_templates')
      .insert({ org_id: orgId, title, body, sort_order: templates.length })
      .select().single();
    if (error) throw error;
    setTemplates((p) => [...p, data]);
  }

  async function updateTemplate(id, patch) {
    const { data, error } = await supabase.from('wa_templates')
      .update(patch).eq('id', id).select().single();
    if (error) throw error;
    setTemplates((p) => p.map((t) => (t.id === id ? data : t)));
  }

  async function deleteTemplate(id) {
    const { error } = await supabase.from('wa_templates').delete().eq('id', id);
    if (error) throw error;
    setTemplates((p) => p.filter((t) => t.id !== id));
  }

  async function saveSignature(sig) {
    const { error } = await supabase.from('wa_settings')
      .upsert({ org_id: orgId, signature: sig, updated_at: new Date().toISOString() });
    if (error) throw error;
    setSignature(sig);
  }

  return {
    templates, signature, loading,
    addTemplate, updateTemplate, deleteTemplate, saveSignature, reload: load,
  };
}

// איתור תבנית ההזמנה המובנית (לשליחת קישור ההזמנה).
export function findInviteTemplate(templates) {
  return templates.find((t) => t.is_system && t.title === 'הזמנת עובד') || null;
}
