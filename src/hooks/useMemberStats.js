import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useMemberStats(memberId, orgId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId || !orgId) return;
    setLoading(true);

    Promise.all([
      supabase
        .from('tasks')
        .select('id, status, due_at, net_seconds, created_at')
        .eq('org_id', orgId)
        .eq('assignee_id', memberId),
    ]).then(([tasksRes]) => {
      const tasks = tasksRes.data ?? [];

      const total = tasks.length;
      const done = tasks.filter((t) => t.status === 'done');
      const active = tasks.filter((t) =>
        ['pending', 'scheduled', 'in_progress', 'paused', 'blocked', 'pending_approval'].includes(t.status),
      );

      const onTime = done.filter((t) => !t.due_at || new Date(t.due_at) >= new Date(t.created_at));
      const onTimePct = done.length > 0 ? Math.round((onTime.length / done.length) * 100) : 0;

      const totalSeconds = tasks.reduce((s, t) => s + (t.net_seconds || 0), 0);
      const avgSeconds = done.length > 0
        ? Math.round(done.reduce((s, t) => s + (t.net_seconds || 0), 0) / done.length)
        : 0;

      const withDeadline = done.filter((t) => t.due_at);
      const metDeadline = withDeadline.filter((t) => {
        const finished = tasks.find((ev) => ev.id === t.id);
        return finished && (!t.due_at || true);
      });
      const deadlinePct = withDeadline.length > 0
        ? Math.round((metDeadline.length / withDeadline.length) * 100)
        : 0;

      setStats({
        total,
        done: done.length,
        active: active.length,
        onTimePct,
        totalSeconds,
        avgSeconds,
        deadlinePct,
      });
      setLoading(false);
    });
  }, [memberId, orgId]);

  return { stats, loading };
}
