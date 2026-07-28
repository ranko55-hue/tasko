import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  elapsedSeconds,
  markOverrun,
  unblockTask,
  addManagerUpdate,
} from '../lib/taskFlow';

const TASK_COLS =
  'id, org_id, title, status, priority, due_at, scheduled_start_at, ' +
  'est_minutes, net_seconds, work_started_at, overrun_alerted, assignee_id, ' +
  'client:clients(name), project:projects(name)';

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

// כל נתוני הלוח + חיות (Realtime עם נפילה חלקה לפולינג כל 15ש')
export function useDashboard(orgId, actorId) {
  const [tasks, setTasks] = useState([]);
  const [blockedReasons, setBlockedReasons] = useState({});
  const [doneTodayIds, setDoneTodayIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [connection, setConnection] = useState('polling'); // 'live' רק אחרי אירוע אמיתי
  const firedOverrun = useRef(new Set());

  const load = useCallback(async () => {
    if (!orgId) return;
    try {
      const { data: t, error: te } = await supabase
        .from('tasks')
        .select(TASK_COLS)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });
      if (te) throw te;

      const { data: ev } = await supabase
        .from('task_events')
        .select('task_id, type, payload, created_at')
        .eq('org_id', orgId)
        .in('type', ['blocked', 'finished'])
        .order('created_at', { ascending: false });

      const reasons = {};
      const doneToday = new Set();
      const todayStart = startOfTodayISO();
      (ev ?? []).forEach((e) => {
        if (e.type === 'blocked' && !(e.task_id in reasons))
          reasons[e.task_id] = e.payload?.text ?? '';
        if (e.type === 'finished' && e.created_at >= todayStart)
          doneToday.add(e.task_id);
      });

      setTasks(t ?? []);
      setBlockedReasons(reasons);
      setDoneTodayIds(doneToday);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  // Realtime + פולינג גיבוי
  useEffect(() => {
    if (!orgId) return;
    load();
    const onChange = () => {
      setConnection('live'); // קיבלנו אירוע אמיתי → זה חי
      load();
    };
    const channel = supabase
      .channel('dashboard-' + orgId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_events' }, onChange)
      .subscribe();
    const poll = setInterval(load, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [orgId, load]);

  // צופה חריגות — כל 5ש', למשימות בעבודה עם מסגרת זמן. נרשם פעם אחת.
  useEffect(() => {
    const id = setInterval(() => {
      tasks.forEach((t) => {
        if (
          t.status === 'in_progress' &&
          t.est_minutes &&
          !t.overrun_alerted &&
          !firedOverrun.current.has(t.id) &&
          elapsedSeconds(t) > t.est_minutes * 60
        ) {
          firedOverrun.current.add(t.id);
          markOverrun(t, actorId).then(load).catch(() => {});
        }
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tasks, actorId, load]);

  async function returnToWork(task) {
    await unblockTask(task, actorId);
    load();
  }
  async function sendManagerUpdate(task, text) {
    await addManagerUpdate(task, actorId, text);
  }

  return {
    tasks,
    blockedReasons,
    doneTodayIds,
    loading,
    error,
    connection,
    returnToWork,
    sendManagerUpdate,
    refetch: load,
  };
}
