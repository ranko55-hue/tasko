import { useMemo, useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { useMeetings } from '../hooks/useMeetings';
import { useClients } from '../hooks/useClients';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useTasksTimeline } from '../hooks/useTasksTimeline';
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
import TimelineView from '../components/calendar/TimelineView';
import MeetingModal from '../components/calendar/MeetingModal';
import TaskDrawer from '../components/tasks/TaskDrawer';

const t = he.calendar;

// מתג התצוגות — שבוע / חודש / ציר-זמן. הוספת תצוגה = שורה כאן + ענף רינדור.
export const CAL_VIEW_OPTIONS = [
  { key: 'week', label: t.viewWeek },
  { key: 'month', label: t.viewMonth },
  { key: 'timeline', label: t.viewTimeline },
];
const TL_SCALE_OPTIONS = [
  { key: 'day', label: t.scaleDay },
  { key: 'week', label: t.scaleWeek },
];

const fmt = (d) => d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

export default function CalendarPage() {
  const { member } = useOrg();
  const [view, setView] = useState('week');
  const [scale, setScale] = useState('week'); // ציר-זמן: יום/שבוע
  const [cursor, setCursor] = useState(() => new Date());
  const [modal, setModal] = useState(null);
  const [taskId, setTaskId] = useState(null);

  const { meetings, loading, createMeeting, updateMeeting, deleteMeeting } = useMeetings(member.org_id);
  const { clients } = useClients(member.org_id);
  const { members } = useOrgMembers(member.org_id);

  const { rangeStart, rangeEnd, days, weeks } = useMemo(() => {
    if (view === 'month') {
      const ws = monthGrid(cursor);
      const flat = ws.flat();
      return { rangeStart: startOfDay(flat[0]), rangeEnd: endOfDay(flat[flat.length - 1]), days: null, weeks: ws };
    }
    if (view === 'timeline' && scale === 'day') {
      return { rangeStart: startOfDay(cursor), rangeEnd: endOfDay(cursor), days: null, weeks: null };
    }
    const ds = weekDays(cursor);
    return { rangeStart: startOfDay(ds[0]), rangeEnd: endOfDay(ds[6]), days: ds, weeks: null };
  }, [view, scale, cursor]);

  const { tasks, loading: tasksLoading } = useTasksTimeline(member.org_id, rangeStart, rangeEnd);

  const events = useMemo(() => expandMeetings(meetings, rangeStart, rangeEnd), [meetings, rangeStart, rangeEnd]);
  const eventsByDate = useMemo(() => groupByDate(events), [events]);

  function shift(dir) {
    setCursor((c) => {
      if (view === 'month') return new Date(c.getFullYear(), c.getMonth() + dir, 1);
      if (view === 'timeline' && scale === 'day') return addDays(c, dir);
      return addDays(c, dir * 7);
    });
  }

  const periodLabel = view === 'month'
    ? cursor.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })
    : (view === 'timeline' && scale === 'day')
      ? cursor.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'short' })
      : `${fmt(days[0])} – ${fmt(days[6])}`;

  const api = { createMeeting, updateMeeting, deleteMeeting };
  const navBtn = 'flex h-10 w-10 items-center justify-center rounded-lg border border-line text-grayDark hover:bg-appBg';
  const busy = loading || (view === 'timeline' && tasksLoading);

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
        <div className="flex items-center gap-2">
          {view === 'timeline' && (
            <ViewToggle options={TL_SCALE_OPTIONS} view={scale} onChange={setScale} />
          )}
          <ViewToggle options={CAL_VIEW_OPTIONS} view={view} onChange={setView} />
        </div>
      </div>

      {busy ? (
        <p className="py-8 text-center text-lg text-grayMid">{he.common.loading}</p>
      ) : view === 'week' ? (
        <WeekView days={days} eventsByDate={eventsByDate} onSlot={(d) => setModal({ initial: { date: d } })} onEvent={(occ) => setModal({ occ })} />
      ) : view === 'month' ? (
        <MonthView weeks={weeks} month={cursor.getMonth()} eventsByDate={eventsByDate} onSlot={(d) => setModal({ initial: { date: d } })} onEvent={(occ) => setModal({ occ })} />
      ) : (
        <TimelineView
          members={members}
          tasks={tasks}
          meetings={events}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          scale={scale}
          onTask={(task) => setTaskId(task.id)}
          onMeeting={(occ) => setModal({ occ })}
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

      <TaskDrawer
        taskId={taskId}
        isOpen={!!taskId}
        onClose={() => setTaskId(null)}
        orgId={member.org_id}
        isManager
      />
    </>
  );
}
