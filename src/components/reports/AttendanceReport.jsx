import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { useAttendanceReport } from '../../hooks/useAttendance';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { monthRange, fmtHours } from '../../lib/attendance';
import { downloadCsv, printReport } from '../../lib/reportExport';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import ViewToggle from '../shared/ViewToggle';
import Select from '../shared/Select';
import AttendanceDailyList from '../attendance/AttendanceDailyList';
import AttendanceReporter from '../attendance/AttendanceReporter';

const a = he.attendance;
const r = he.reports;
const NUM = { fontVariantNumeric: 'tabular-nums' };
const GRID = 'grid grid-cols-[minmax(0,1.6fr)_76px_64px_64px_72px] gap-2';
const SCOPES = [{ key: 'all', label: r.scopeAll }, { key: 'one', label: r.scopeOne }];

function hoursCell(e) {
  if (e.type !== 'work') return '—';
  if (e.start_time && e.end_time) return `${e.start_time.slice(0, 5)}–${e.end_time.slice(0, 5)} · ${fmtHours(e.hours)}`;
  return `${fmtHours(e.hours)} ${a.hoursUnit}`;
}

export default function AttendanceReport({ orgId }) {
  const { member } = useOrg();
  const { settings } = useOrgSettings(orgId);
  const init = monthRange();
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [scope, setScope] = useState('all');
  const [selId, setSelId] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const { rows, entriesByMember, members, loading, refetch } = useAttendanceReport(orgId, from, to);

  const selMember = members.find((m) => m.id === selId) || null;
  const selEntries = selId ? Object.values(entriesByMember[selId] || {}).sort((x, y) => (x.date < y.date ? 1 : -1)) : [];
  const dateInput = 'min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-navy focus:border-brand focus:outline-none';

  function pickScope(s) { setScope(s); setSelId(null); setCorrecting(false); }

  function exportAllCsv() {
    const header = [a.colName, `${a.types.work} (${a.hoursUnit})`, a.types.vacation, a.types.sick, a.unreported];
    downloadCsv(`attendance_${from}_${to}.csv`, [header, ...rows.map((row) => [row.member.full_name, fmtHours(row.workHours), row.vacation, row.sick, row.unreported])]);
  }
  function printAll() {
    printReport(`${r.attendance.title} · ${from} – ${to}`,
      [a.colName, `${a.types.work} (${a.hoursUnit})`, a.types.vacation, a.types.sick, a.unreported],
      rows.map((row) => [row.member.full_name, fmtHours(row.workHours), row.vacation, row.sick, row.unreported]));
  }
  function exportOneCsv() {
    downloadCsv(`attendance_${selMember.full_name}_${from}_${to}.csv`,
      [[a.date, a.typeCol, a.hoursCol, a.noteLabel], ...selEntries.map((e) => [e.date, a.types[e.type], hoursCell(e), e.note || ''])]);
  }
  function printOne() {
    printReport(`${selMember.full_name} · ${from} – ${to}`,
      [a.date, a.typeCol, a.hoursCol, a.noteLabel],
      selEntries.map((e) => [e.date, a.types[e.type], hoursCell(e), e.note || '']));
  }

  return (
    <div className="space-y-4">
      {/* בקרות */}
      <div className="flex flex-wrap items-end gap-3">
        <ViewToggle options={SCOPES} view={scope} onChange={pickScope} />
        <label className="flex flex-col gap-1"><span className="text-xs text-grayMid">{r.from}</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={dateInput} /></label>
        <label className="flex flex-col gap-1"><span className="text-xs text-grayMid">{r.to}</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={dateInput} /></label>
      </div>

      {scope === 'one' && (
        <Select label={r.pickEmployee} value={selId || ''} onChange={(v) => { setSelId(v || null); setCorrecting(false); }}>
          <option value="">{r.pickEmployeePh}</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
        </Select>
      )}

      {loading ? (
        <p className="py-8 text-center text-grayMid">{he.common.loading}</p>
      ) : scope === 'all' ? (
        <>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" fullWidth={false} onClick={exportAllCsv}>{r.exportCsv}</Button>
            <Button variant="ghost" size="sm" fullWidth={false} onClick={printAll}>{r.print}</Button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[460px]">
              <div className={`${GRID} rounded-lg bg-[#f4f6f8] px-3 py-2 text-[11px] font-extrabold tracking-wide text-grayMid`}>
                <span>{a.colName}</span>
                <span className="text-center">{a.types.work}</span>
                <span className="text-center">{a.types.vacation}</span>
                <span className="text-center">{a.types.sick}</span>
                <span className="text-center">{a.unreported}</span>
              </div>
              <div className="mt-1 space-y-1">
                {rows.map((row) => (
                  <button key={row.member.id} type="button" onClick={() => setSelId(row.member.id)}
                    className={`${GRID} w-full items-center rounded-lg border px-3 py-2 text-start ${selId === row.member.id ? 'border-brand bg-brand/5' : 'border-line bg-white'}`}>
                    <span className="truncate font-bold text-navy">{row.member.full_name}</span>
                    <span className="text-center font-bold text-green-700" style={NUM}>{fmtHours(row.workHours)}</span>
                    <span className="text-center font-bold text-blue-700" style={NUM}>{row.vacation}</span>
                    <span className="text-center font-bold text-yellow-700" style={NUM}>{row.sick}</span>
                    <span className="text-center font-bold text-grayLight" style={NUM}>{row.unreported}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* פירוט עובד — משותף ל'עובד ספציפי' ולצלילה מטבלת 'כל העובדים' */}
      {selMember && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-navy">{selMember.full_name}</h3>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" fullWidth={false} onClick={exportOneCsv}>{r.exportCsv}</Button>
              <Button variant="ghost" size="sm" fullWidth={false} onClick={printOne}>{r.print}</Button>
              <Button size="sm" fullWidth={false} onClick={() => setCorrecting((v) => !v)}>{r.correct}</Button>
            </div>
          </div>

          {correcting && (
            <div className="mb-3">
              <AttendanceReporter
                orgId={orgId}
                targetMemberId={selMember.id}
                reportedBy={member.id}
                settings={settings}
                pastLimitDays={null}
                onSaved={() => { refetch(); }}
              />
            </div>
          )}

          <AttendanceDailyList entries={selEntries} canViewNotes empty={a.noEntries} />
        </div>
      )}
    </div>
  );
}
