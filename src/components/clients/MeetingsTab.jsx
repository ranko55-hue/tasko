import { useMemo, useState } from 'react';
import { useMeetings } from '../../hooks/useMeetings';
import { useClients } from '../../hooks/useClients';
import { expandMeetings, addDays, hhmm } from '../../lib/calendar';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import MeetingModal from '../calendar/MeetingModal';

const t = he.calendar;

// לשונית "פגישות" בכרטיס לקוח — קרובות + שהתקיימו (מהחדש לישן).
export default function MeetingsTab({ clientId, orgId, memberId }) {
  const { meetings, loading, createMeeting, updateMeeting, deleteMeeting } = useMeetings(orgId, { clientId });
  const { clients } = useClients(orgId);
  const [modal, setModal] = useState(null);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const all = expandMeetings(meetings, addDays(now, -365), addDays(now, 730));
    const up = all.filter((e) => e.end >= now);
    const pa = all.filter((e) => e.end < now).reverse(); // מהחדש לישן
    return { upcoming: up, past: pa };
  }, [meetings]);

  const api = { createMeeting, updateMeeting, deleteMeeting };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" fullWidth={false} onClick={() => setModal({ initial: { clientId } })}>
          {t.newMeeting}
        </Button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-grayMid">{he.common.loading}</p>
      ) : (
        <>
          <Section title={t.upcoming} events={upcoming} empty={t.noUpcoming} onEvent={(occ) => setModal({ occ })} />
          <Section title={t.past} events={past} empty={t.noPast} onEvent={(occ) => setModal({ occ })} />
        </>
      )}

      {modal && (
        <MeetingModal
          occ={modal.occ}
          initial={modal.initial}
          clients={clients}
          memberId={memberId}
          api={api}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function Section({ title, events, empty, onEvent }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold tracking-wide text-grayMid">{title}</h3>
      {events.length === 0 ? (
        <p className="rounded-lg bg-surface p-3 text-sm text-grayLight">{empty}</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <button
              key={e.key}
              type="button"
              onClick={() => onEvent(e)}
              className="flex w-full items-center gap-3 rounded-lg border border-drLine bg-white p-3 text-start"
            >
              <span className="text-sm font-bold text-drBlue" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {e.start.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} · {hhmm(e.start)}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold text-navy">{e.meeting.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
