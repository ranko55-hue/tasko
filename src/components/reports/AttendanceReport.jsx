import { useState } from 'react';
import { useAttendanceReport } from '../../hooks/useAttendance';
import { monthRange } from '../../lib/attendance';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import AttendanceDailyList from '../attendance/AttendanceDailyList';

const a = he.attendance;
const r = he.reports;
const NUM = { fontVariantNumeric: 'tabular-nums' };
const GRID = 'grid grid-cols-[minmax(0,1.6fr)_64px_64px_64px_72px] gap-2';

// דוח נוכחות — כל העובדים × טווח, סיכומים לשורה, לחיצה → פירוט יומי.
export default function AttendanceReport({ orgId }) {
  const init = monthRange();
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [sel, setSel] = useState(null);
  const { rows, entriesByMember, loading } = useAttendanceReport(orgId, from, to);

  const dateInput = 'min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-navy focus:border-brand focus:outline-none';

  const selEntries = sel
    ? Object.values(entriesByMember[sel.member.id] || {}).sort((x, y) => (x.date < y.date ? 1 : -1))
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1"><span className="text-xs text-grayMid">{r.from}</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={dateInput} /></label>
        <label className="flex flex-col gap-1"><span className="text-xs text-grayMid">{r.to}</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={dateInput} /></label>
      </div>

      {loading ? (
        <p className="py-8 text-center text-grayMid">{he.common.loading}</p>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[440px]">
            {/* שורת כותרות עמודות */}
            <div className={`${GRID} rounded-lg bg-[#f4f6f8] px-3 py-2 text-[11px] font-extrabold tracking-wide text-grayMid`}>
              <span>{a.colName}</span>
              <span className="text-center">{a.types.work}</span>
              <span className="text-center">{a.types.vacation}</span>
              <span className="text-center">{a.types.sick}</span>
              <span className="text-center">{a.unreported}</span>
            </div>

            <div className="mt-1 space-y-1">
              {rows.map((row) => (
                <button
                  key={row.member.id}
                  type="button"
                  onClick={() => setSel(row)}
                  className={`${GRID} w-full items-center rounded-lg border px-3 py-2 text-start ${sel?.member.id === row.member.id ? 'border-brand bg-brand/5' : 'border-line bg-white'}`}
                >
                  <span className="truncate font-bold text-navy">{row.member.full_name}</span>
                  <span className="text-center font-bold text-green-700" style={NUM}>{row.work}</span>
                  <span className="text-center font-bold text-blue-700" style={NUM}>{row.vacation}</span>
                  <span className="text-center font-bold text-yellow-700" style={NUM}>{row.sick}</span>
                  <span className="text-center font-bold text-grayLight" style={NUM}>{row.unreported}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {sel && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-black text-navy">{sel.member.full_name}</h3>
            <Button variant="ghost" size="sm" fullWidth={false} onClick={() => setSel(null)}>{he.common.close}</Button>
          </div>
          <AttendanceDailyList entries={selEntries} canViewNotes />
        </div>
      )}
    </div>
  );
}
