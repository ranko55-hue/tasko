import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const COLS =
  'id, org_id, title, client_id, starts_at, ends_at, location, notes, ' +
  'recurrence, recurrence_until, parent_id, excluded_dates, created_by, ' +
  'client:clients(name)';

// שכבת נתוני היומן — כללית בכוונה (טווח + הרחבה נעשים בצד הלקוח דרך lib/calendar),
// כדי שבבלוק הגאנט אפשר יהיה למזג גם משימות. clientId — סינון ללשונית הלקוח.
export function useMeetings(orgId, { clientId } = {}) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    let q = supabase.from('meetings').select(COLS).eq('org_id', orgId);
    if (clientId) q = q.eq('client_id', clientId);
    const { data } = await q.order('starts_at', { ascending: true });
    setMeetings(data ?? []);
    setLoading(false);
  }, [orgId, clientId]);

  useEffect(() => { load(); }, [load]);

  async function createMeeting(payload) {
    const { error } = await supabase.from('meetings').insert({ org_id: orgId, ...payload });
    if (error) throw error;
    await load();
  }

  // scope: 'series' | 'one'. occ — המופע שנלחץ (מכיל meeting, start, date).
  async function updateMeeting(occ, patch, scope) {
    const master = occ.meeting;
    if (scope === 'series' || master.recurrence === 'none') {
      const { error } = await supabase.from('meetings').update(patch).eq('id', master.id);
      if (error) throw error;
    } else {
      // "רק פגישה זו": מחריגים את התאריך מהמאסטר + שורה עצמאית עם השינויים
      const excluded = Array.from(new Set([...(master.excluded_dates || []), occ.date]));
      const { error: e1 } = await supabase.from('meetings')
        .update({ excluded_dates: excluded }).eq('id', master.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from('meetings').insert({
        org_id: orgId,
        parent_id: master.id,
        recurrence: 'none',
        title: patch.title ?? master.title,
        client_id: patch.client_id !== undefined ? patch.client_id : master.client_id,
        starts_at: patch.starts_at ?? master.starts_at,
        ends_at: patch.ends_at ?? master.ends_at,
        location: patch.location ?? master.location,
        notes: patch.notes ?? master.notes,
        created_by: patch.created_by ?? master.created_by,
      });
      if (e2) throw e2;
    }
    await load();
  }

  async function deleteMeeting(occ, scope) {
    const master = occ.meeting;
    if (scope === 'series' || master.recurrence === 'none') {
      const { error } = await supabase.from('meetings').delete().eq('id', master.id);
      if (error) throw error;
    } else {
      const excluded = Array.from(new Set([...(master.excluded_dates || []), occ.date]));
      const { error } = await supabase.from('meetings')
        .update({ excluded_dates: excluded }).eq('id', master.id);
      if (error) throw error;
    }
    await load();
  }

  return { meetings, loading, refetch: load, createMeeting, updateMeeting, deleteMeeting };
}
