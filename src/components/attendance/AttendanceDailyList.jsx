import { useState } from 'react';
import { signedSickNoteUrl, fmtHours } from '../../lib/attendance';
import { he } from '../../locales/he';

const a = he.attendance;
const TONE = {
  work: 'bg-green-100 text-green-700',
  vacation: 'bg-blue-100 text-blue-700',
  sick: 'bg-yellow-100 text-yellow-800',
};

function fmt(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
}

// פירוט יומי של נוכחות עובד. canViewNotes — קישור לאישור מחלה (מנהל/העובד).
export default function AttendanceDailyList({ entries, canViewNotes = false, empty }) {
  const [busy, setBusy] = useState(null);

  async function openNote(e) {
    setBusy(e.id);
    try {
      const url = await signedSickNoteUrl(e.attachment_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch { /* הקישור פשוט לא ייפתח */ }
    setBusy(null);
  }

  if (!entries || entries.length === 0) {
    return <p className="rounded-lg bg-surface p-3 text-sm text-grayLight">{empty ?? a.noEntries}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-white p-3">
          <span className="w-20 shrink-0 text-sm font-bold text-navy">{fmt(e.date)}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[e.type]}`}>{a.types[e.type]}</span>
          {e.type === 'work' && e.hours != null && (
            <span className="text-sm font-bold text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>{hoursText(e)}</span>
          )}
          {e.reported_by && e.reported_by !== e.member_id && (
            <span className="rounded-md bg-appBg px-2 py-0.5 text-[11px] font-bold text-grayMid">{a.byManager}</span>
          )}
          {e.note && <span className="min-w-0 flex-1 truncate text-sm text-grayMid">{e.note}</span>}
          {canViewNotes && e.attachment_path && (
            <button
              type="button"
              onClick={() => openNote(e)}
              disabled={busy === e.id}
              className="mr-auto shrink-0 text-sm font-bold text-brand hover:underline"
            >
              {busy === e.id ? he.common.loading : a.viewNote}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function hoursText(e) {
  if (e.start_time && e.end_time) {
    return `${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)} · ${fmtHours(e.hours)} ${a.hoursUnit}`;
  }
  return `${a.fullDay} · ${fmtHours(e.hours)} ${a.hoursUnit}`;
}
