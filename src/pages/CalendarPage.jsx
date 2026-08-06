import { useMemo, useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import {
  weekDays, monthGrid, addDays, startOfDay, endOfDay, expandMeetings, groupByDate,
} from '../lib/calendar';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/shared/Button';
import ViewToggle from '../components/shared/ViewToggle';
import Icon from '../components/ui/Icon';
import WeekView from '../components/calendar/WeekView';
import MonthView from '../components/calendar/MonthView';
import MeetingModal from '../components/calendar/MeetingModal';

const t = he.calendar;

// מתג התצוגות — בנוי להוספת תצוגה שלישית (ציר זמן/גאנט) בזול: עוד שורה כאן
// + עוד ענף ברינדור. שכבת הנתונים (useMeetings + expandMeetings) גנרית לטווח.
export const CAL_VIEW_OPTIONS = [
  { key: 'week', label: t.viewWeek },
  { key: 'month', label: t.viewMonth },
];

const fmt = (d) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

export default function CalendarPage() {
  const { member } = useOrg();
  const [view, setView] = useState('week');
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null); // { occ } | { initial }

  const { meetings, loading, createMeeting, updateMeeting, deleteMeeting } = useMeetings(member.org_id);
  const { clients } = useClients(member.org_id);

  const { rangeStart, rangeEnd, days, weeks } = useMemo(() => {
    if (view === 'week') {
      const ds = weekDays(cursor);
      return { rangeStart: startOfDay(ds[0]), rangeEnd: endOfDay(ds[6]), days: ds, weeks: null };
    }
    const ws = monthGrid(cursor);
    const flat = ws.flat();
    return { rangeStart: startOfDay(flat[0]), rangeEnd: endOfDay(flat[flat.length - 1]), days: null, weeks: ws };
  }, [view, cursor]);

  const eventsByDate = useMemo(
    () => groupByDate(expandMeetings(meetings, rangeStart, rangeEnd)),
    [meetings, rangeStart, rangeEnd],
  );

  function shift(dir) {
    setCursor((c) => (view === 'week' ? addDays(c, dir * 7) : new Date(c.getFullYear(), c.getMonth() + dir, 1)));
  }

  const periodLabel = view === 'week'
    ? `${fmt(days[0])} – ${fmt(days[6])}`
    : cursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });

  const api = { createMeeting, updateMeeting, deleteMeeting };
  const navBtn = 'flex h-10 w-10 items-center justify-center rounded-lg border border-line text-grayDark hover:bg-appBg';

  return (
    <>
      <PageHeader
        title={t.title}
        actions={<div className="w-40"><Button onClick={() => setModal({ initial: {} })}>{t.newMeeting}</Button></div>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className={navBtn} aria-label={t.prev} onClick={() => shift(-1)}>
            <Icon name="back" size="sm" strokeWidth={2} className="rotate-180" />
          </button>
          <Button variant="secondary" size="sm" fullWidth={false} onClick={() => setCursor(new Date())}>{t.today}</Button>
          <button type="button" className={navBtn} aria-label={t.next} onClick={() => shift(1)}>
            <Icon name="back" size="sm" strokeWidth={2} />
          </button>
          <span className="mr-2 font-bold text-navy">{periodLabel}</span>
        </div>
        <ViewToggle options={CAL_VIEW_OPTIONS} view={view} onChange={setView} />
      </div>

      {loading ? (
        <p className="py-8 text-center text-lg text-grayMid">{he.common.loading}</p>
      ) : view === 'week' ? (
        <WeekView
          days={days}
          eventsByDate={eventsByDate}
          onSlot={(d) => setModal({ initial: { date: d } })}
          onEvent={(occ) => setModal({ occ })}
        />
      ) : (
        <MonthView
          weeks={weeks}
          month={cursor.getMonth()}
          eventsByDate={eventsByDate}
          onSlot={(d) => setModal({ initial: { date: d } })}
          onEvent={(occ) => setModal({ occ })}
        />
      )}

      {modal && (
        <MeetingModal
          occ={modal.occ}
          initial={modal.initial}
          clients={clients}
          memberId={member.id}
          api={api}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
