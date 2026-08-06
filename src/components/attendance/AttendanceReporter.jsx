import { useRef, useState } from 'react';
import { buildEntries, saveAttendance, uploadSickNote, ymd } from '../../lib/attendance';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import ViewToggle from '../shared/ViewToggle';
import Icon from '../ui/Icon';

const a = he.attendance;

const TYPE_TILE = {
  work: { base: 'bg-green-50 text-green-700 ring-green-200', on: 'bg-statusGreen text-white ring-statusGreen', icon: 'check' },
  vacation: { base: 'bg-blue-50 text-blue-700 ring-blue-200', on: 'bg-statusBlue text-white ring-statusBlue', icon: 'calendar' },
  sick: { base: 'bg-yellow-50 text-yellow-800 ring-yellow-200', on: 'bg-brandYellow text-navy ring-brandYellow', icon: 'support' },
};
const SCOPES = [
  { key: 'full', label: a.scope.full },
  { key: 'hours', label: a.scope.hours },
  { key: 'range', label: a.scope.range },
];

// רכיב דיווח יחיד — סוג (אריחי כפפה) + היקף (יום מלא / שעות / טווח תאריכים).
// משמש את /attendance (דיווח עצמי) ואת תיקון-המנהל (targetMemberId אחר).
export default function AttendanceReporter({ orgId, targetMemberId, reportedBy, settings, pastLimitDays, onSaved }) {
  const today = ymd();
  const [type, setType] = useState('work');
  const [scope, setScope] = useState('full');
  const [date, setDate] = useState(today);
  const [start, setStart] = useState(settings?.work_start_time || '08:00');
  const [end, setEnd] = useState(settings?.work_end_time || '17:00');
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [note, setNote] = useState('');
  const [attachmentPath, setAttachmentPath] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  const minDate = pastLimitDays != null ? ymd(new Date(Date.now() - pastLimitDays * 86400000)) : undefined;

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const path = await uploadSickNote(orgId, targetMemberId, file);
      setAttachmentPath(path);
      setMsg(a.noteAttached);
    } catch { setErr(a.uploadError); }
    setBusy(false);
  }

  async function submit() {
    setErr(''); setMsg('');
    if (scope === 'hours' && end <= start) return setErr(a.timeOrder);
    if (scope === 'range' && to < from) return setErr(a.rangeOrder);
    setBusy(true);
    try {
      const rows = buildEntries({
        orgId, memberId: targetMemberId, reportedBy, type, scope,
        date, start, end, from, to, note: note.trim(), attachmentPath, settings,
      });
      await saveAttendance(rows);
      setMsg(a.saved);
      setNote(''); setAttachmentPath(null);
      onSaved?.();
    } catch { setErr(a.saveError); }
    setBusy(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4">
      {/* סוג */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {['work', 'vacation', 'sick'].map((k) => {
          const s = TYPE_TILE[k];
          const on = type === k;
          return (
            <button key={k} type="button" onClick={() => setType(k)}
              className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl px-2 text-center ring-1 transition-colors ${on ? s.on : s.base}`}>
              <Icon name={s.icon} size="lg" strokeWidth={2} />
              <span className="text-sm font-black">{a.types[k]}</span>
            </button>
          );
        })}
      </div>

      {/* היקף */}
      <ViewToggle options={SCOPES} view={scope} onChange={setScope} />

      {scope === 'full' && (
        <Field label={a.date} type="date" value={date} min={minDate} onChange={setDate} />
      )}
      {scope === 'hours' && (
        <div className="space-y-3">
          <Field label={a.date} type="date" value={date} min={minDate} onChange={setDate} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={a.fromHour} type="time" value={start} onChange={setStart} />
            <Field label={a.toHour} type="time" value={end} onChange={setEnd} />
          </div>
        </div>
      )}
      {scope === 'range' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label={a.fromDate} type="date" value={from} min={minDate} onChange={setFrom} />
          <Field label={a.toDate} type="date" value={to} min={from} onChange={setTo} />
        </div>
      )}

      {type === 'sick' && (
        <div>
          <Button variant="secondary" size="sm" fullWidth={false} disabled={busy} onClick={() => fileRef.current?.click()}>
            {attachmentPath ? a.noteAttached : a.attachNote}
          </Button>
          <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onFile} />
        </div>
      )}

      <Field label={`${a.noteLabel} ${he.common.optional}`} value={note} onChange={setNote} />

      {err && <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{err}</p>}
      {msg && !err && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{msg}</p>}

      <Button onClick={submit} disabled={busy}>{busy ? he.common.loading : a.confirm}</Button>
    </div>
  );
}
