import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// חישוב ריאלי של הצ'יפים — קריאות חדשות, בעיכוב, בחריגה, לא נסגרה בזמן
export function useAlerts(orgId) {
  const [alerts, setAlerts] = useState({
    new_calls: 0,
    delayed: 0,
    overrun: 0,
    unclosed: 0,
  });
  const [serviceRequests, setServiceRequests] = useState([]);
  const [blockedTasks, setBlockedTasks] = useState([]);
  const [overrunTasks, setOverrunTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // קריאות חדשות
      const { data: srData } = await supabase
        .from('service_requests')
        .select('id, client_id, requester_name, requester_phone, description, created_at, clients(name)')
        .eq('org_id', orgId)
        .eq('status', 'new')
        .order('created_at', { ascending: true });
      setServiceRequests(srData || []);

      // משימות עם בעיכוב (blocked)
      const { data: blockedData } = await supabase
        .from('tasks')
        .select('id, title, status, assignee_id, org_members(full_name), created_at')
        .eq('org_id', orgId)
        .eq('status', 'blocked')
        .order('created_at', { ascending: true });
      setBlockedTasks(blockedData || []);

      // משימות עם חריגה
      const { data: overrunData } = await supabase
        .from('tasks')
        .select('id, title, status, assignee_id, org_members(full_name), created_at')
        .eq('org_id', orgId)
        .eq('overrun_alerted', true);
      setOverrunTasks(overrunData || []);

      // משימות לא סגורות שעבר להן due_at
      const now = new Date().toISOString();
      const { data: unclosedData } = await supabase
        .from('tasks')
        .select('id, title, status, assignee_id, due_at, org_members(full_name), created_at')
        .eq('org_id', orgId)
        .neq('status', 'done')
        .neq('status', 'cancelled')
        .lt('due_at', now)
        .order('created_at', { ascending: true });

      setAlerts({
        new_calls: srData?.length || 0,
        delayed: blockedData?.length || 0,
        overrun: overrunData?.length || 0,
        unclosed: unclosedData?.length || 0,
      });
    } catch (err) {
      console.error('Alert fetch error:', err);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  // חבור לממשק הרזי וקבל נתונים זורמים בכל 10 שניות
  useEffect(() => {
    if (!orgId) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load, orgId]);

  return { alerts, serviceRequests, blockedTasks, overrunTasks, loading, refetch: load };
}
