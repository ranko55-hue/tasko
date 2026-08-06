import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyAttendance } from '../../hooks/useAttendance';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { uploadSickNote, fullDayHours, ymd } from '../../lib/attendance';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';

const a = he.attendance;

// אריח כפפה גדול — בסיס רך, נבחר = מלא. מטרת מגע ענקית לאיש השטח.
const TILE = {
  work: { base: 'bg-green-50 text-green-700 ring-green-200', on: 'bg-statusGreen text-white ring-statusGreen', icon: 'check' },
  vacation: { base: 'bg-blue-50 text-blue-700 ring-blue-200', on: 'bg-statusBlue text-white ring-statusBlue', icon: 'calendar' },
  sick: { base: 'bg-yellow-50 text-yellow-800 ring-yellow-200', on: 'bg-brandYellow text-navy ring-brandYellow', icon: 'support' },
};
const minDate = () => ymd(new Date(Date.now() - 7 * 86400000));

export default function AttendanceCard({ orgId, memberId }) {
  const { byDate, report } = useMyAttendance(orgId, memberId);
  const { settings } = useOrgSettings(orgId);
  const [date, setDate] = useState(ymd());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const entry = byDate[date];
  const today = ymd();
  const meta = () => ({ hours: fullDayHours(settings), reported_by: memberId });

  async function pick(type) {
    if (busy) return;
    setErr('');
    if (type === 'sick') {
      // מדווחים מיד (יום מלא); העלאת אישור אופציונלית אחר כך
      try { setBusy(true); await report(date, 'sick', meta()); } catch { setErr(a.saveError); } finally { setBusy(false); }
      fileRef.current?.click();
      return;
    }
    try { setBusy(true); await report(date, type, meta()); } catch { setErr(a.saveError); } finally { setBusy(false); }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const path = await uploadSickNote(orgId, memberId, file);
      await report(date, 'sick', { ...meta(), attachment_path: path });
    } catch { setErr(a.uploadError); }
    setBusy(false);
  }

  return (
    <div className="mb-4 rounded-2xl border border-line bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-black text-navy">{a.title}</h2>
        <input
          type="date"
          value={date}
          min={minDate()}
          max={today}
          onChange={(e) => setDate(e.target.value)}
          className="min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-navy focus:border-brand focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {['work', 'vacation', 'sick'].map((type) => {
          const on = entry?.type === type;
          const s = TILE[type];
          return (
            <button
              key={type}
              type="button"
              disabled={busy}
              onClick={() => pick(type)}
              className={`flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-xl px-2 text-center ring-1 transition-colors disabled:opacity-60 ${on ? s.on : s.base}`}
            >
              <Icon name={s.icon} size="lg" strokeWidth={2} />
              <span className="text-sm font-black">{a.types[type]}</span>
            </button>
          );
        })}
      </div>

      <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onFile} />

      <p className="mt-3 text-sm text-grayMid">
        {entry ? a.reported.replace('{type}', a.types[entry.type]) + (entry.type === 'sick' && !entry.attachment_path ? ` · ${a.addNoteHint}` : entry.attachment_path ? ` · ${a.noteAttached}` : '') : a.notReported}
      </p>
      {err && <p className="mt-2 text-sm font-medium text-urgentInk">{err}</p>}

      <Link to="/attendance" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
        {a.allMyReports}
      </Link>
    </div>
  );
}
