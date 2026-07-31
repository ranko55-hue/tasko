import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { lateCount } from '../lib/lateness';

// ל-tasks יש שלושה מפתחות זרים ל-org_members (assignee_id, created_by, team_lead_id),
// ולכן חובה לציין במפורש דרך איזה מהם לשלוף — אחרת PostgREST מחזיר PGRST201.
// השדה מקבל כינוי מפורש (assignee) כדי ששם המפתח בתשובה יהיה ודאי.
const ASSIGNEE = 'assignee:org_members!tasks_assignee_id_fkey(full_name)';

const EMPTY = { new_calls: 0, delayed: 0, overrun: 0, unclosed: 0, expiringDocs: 0 };

// מריץ שאילתה בודדת ולא נותן לה להפיל את השאר.
// מחזיר מערך בהצלחה, או null בכישלון — כדי להבדיל בין "אין נתונים" ל"לא ידוע".
async function runQuery(label, query) {
  const { data, error } = await query;
  if (error) {
    console.error(`useAlerts[${label}]`, error.code ?? '', error.message ?? error, error.hint ?? '');
    return null;
  }
  return data ?? [];
}

// חישוב ריאלי של הצ'יפים — קריאות חדשות, בעיכוב, בחריגה, לא נסגרה בזמן.
// כל ארבע השאילתות רצות במקביל ובאופן עצמאי: כשלון באחת משאיר את השאר תקינות.
export function useAlerts(orgId) {
  const [alerts, setAlerts] = useState(EMPTY);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [blockedTasks, setBlockedTasks] = useState([]);
  const [overrunTasks, setOverrunTasks] = useState([]);
  const [unclosedTasks, setUnclosedTasks] = useState([]);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const in30 = new Date(Date.now() + 30 * 86400000).toISOString();
    const [sr, blocked, overrun, unclosed, expDocs] = await Promise.all([
      runQuery(
        'service_requests',
        supabase
          .from('service_requests')
          .select('id, client_id, requester_name, requester_phone, description, created_at, clients(name)')
          .eq('org_id', orgId)
          .eq('status', 'new')
          .order('created_at', { ascending: true })
      ),
      runQuery(
        'blocked',
        supabase
          .from('tasks')
          .select(`id, title, status, assignee_id, created_at, ${ASSIGNEE}`)
          .eq('org_id', orgId)
          .eq('status', 'blocked')
          .order('created_at', { ascending: true })
      ),
      runQuery(
        'overrun',
        supabase
          .from('tasks')
          .select(`id, title, status, assignee_id, created_at, ${ASSIGNEE}`)
          .eq('org_id', orgId)
          .eq('overrun_alerted', true)
          .order('created_at', { ascending: true })
      ),
      runQuery(
        'unclosed',
        supabase
          .from('tasks')
          .select(`id, title, status, assignee_id, due_at, created_at, ${ASSIGNEE}`)
          .eq('org_id', orgId)
          .not('status', 'in', '(done,cancelled)')
          .lt('due_at', now)
          .order('created_at', { ascending: true })
      ),
      runQuery(
        'expiring_docs',
        supabase
          .from('employee_documents')
          .select('id, name, expires_at, member:org_members!employee_documents_member_id_fkey(full_name)')
          .eq('org_id', orgId)
          .not('expires_at', 'is', null)
          .lte('expires_at', in30)
          .order('expires_at', { ascending: true })
      ),
    ]);

    // רק שאילתה שהצליחה מעדכנת את המצב; שאילתה שנכשלה משאירה את הערך הקודם
    if (sr) setServiceRequests(sr);
    if (blocked) setBlockedTasks(blocked);
    if (overrun) setOverrunTasks(overrun);
    if (unclosed) setUnclosedTasks(unclosed);
    if (expDocs) setExpiringDocs(expDocs);

    setAlerts((prev) => ({
      new_calls: sr ? sr.length : prev.new_calls,
      delayed: blocked ? blocked.length : prev.delayed,
      overrun: overrun ? overrun.length : prev.overrun,
      unclosed: unclosed ? lateCount(unclosed) : prev.unclosed,
      expiringDocs: expDocs ? expDocs.length : prev.expiringDocs,
    }));

    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  // אין Realtime בסביבה הזו — פולינג כל 10 שניות
  useEffect(() => {
    if (!orgId) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load, orgId]);

  return {
    alerts,
    serviceRequests,
    blockedTasks,
    overrunTasks,
    unclosedTasks,
    expiringDocs,
    loading,
    refetch: load,
  };
}
