import { useState } from 'react';
import { signedSickNoteUrl } from '../../lib/attendance';
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
        <div key={e.id} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3">
          <span className="w-24 shrink-0 text-sm font-bold text-navy">{fmt(e.date)}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONE[e.type]}`}>{a.types[e.type]}</span>
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
