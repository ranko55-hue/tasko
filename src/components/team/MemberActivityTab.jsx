import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';

const t = he.team.detail;
const eventLabels = he.media.eventTypes;

function fmtDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }) +
    ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return t.never;
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'לפני דקה';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דקות`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  return `לפני ${Math.floor(diff / 86400)} ימים`;
}

export default function MemberActivityTab({ memberId, orgId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!memberId || !orgId) return;
    setLoading(true);

    supabase
      .from('task_events')
      .select('id, type, payload, created_at, task:tasks(id, title)')
      .eq('org_id', orgId)
      .eq('actor_id', memberId)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEvents(data ?? []);
        setLoading(false);
      });
  }, [memberId, orgId]);

  if (loading) return <p className="py-8 text-center text-grayMid">{he.common.loading}</p>;

  const lastSeen = events[0]?.created_at;

  return (
    <div>
      <p className="mb-4 text-sm text-grayMid">
        {t.lastSeen}: <span className="font-bold">{timeAgo(lastSeen)}</span>
      </p>

      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-grayLight">{t.activityEmpty}</p>
      ) : (
        <div className="divide-y divide-line">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-start gap-3 py-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-grayLight" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-inkSoft">
                  <span className="font-bold">{eventLabels[ev.type] ?? ev.type}</span>
                  {ev.task?.title && (
                    <span className="text-grayMid"> — {ev.task.title}</span>
                  )}
                </p>
                {ev.payload?.text && (
                  <p className="mt-1 text-xs text-grayMid">{ev.payload.text}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-grayLight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fmtDateTime(ev.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
