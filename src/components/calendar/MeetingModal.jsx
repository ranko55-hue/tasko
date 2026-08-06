import { useState } from 'react';
import { ymd, hhmm } from '../../lib/calendar';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Select from '../shared/Select';

const t = he.calendar;
const RECS = ['none', 'daily', 'weekly', 'biweekly', 'monthly'];

function toISO(dateStr, timeStr) {
  return new Date(`${dateStr}T${timeStr}`).toISOString();
}

// מודאל פגישה — יצירה / צפייה / עריכה / מחיקה. עריכת פגישה מחזורית שואלת
// "רק זו / כל הסדרה". api = { createMeeting, updateMeeting, deleteMeeting }.
export default function MeetingModal({ occ, initial, clients, memberId, api, onClose }) {
  const m = occ?.meeting;
  const isRecurring = !!m && m.recurrence !== 'none';
  const [editing, setEditing] = useState(!occ); // חדש → ישר בטופס
  const [pending, setPending] = useState(null); // 'save' | 'delete' — בחירת היקף
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState(() => ({
    title: m?.title ?? '',
    date: occ ? ymd(occ.start) : (initial?.date ?? ymd(new Date())),
    start: occ ? hhmm(occ.start) : '09:00',
    end: occ ? hhmm(occ.end) : '10:00',
    client_id: m?.client_id ?? initial?.clientId ?? '',
    location: m?.location ?? '',
    notes: m?.notes ?? '',
    recurrence: m?.recurrence ?? 'none',
    until: m?.recurrence_until ?? '',
  }));
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  function buildPatch() {
    return {
      title: f.title.trim(),
      client_id: f.client_id || null,
      starts_at: toISO(f.date, f.start),
      ends_at: toISO(f.date, f.end),
      location: f.location.trim() || null,
      notes: f.notes.trim() || null,
      recurrence: f.recurrence,
      recurrence_until: f.recurrence !== 'none' && f.until ? f.until : null,
    };
  }

  async function doSave(scope) {
    setError('');
    if (!f.title.trim()) return setError(t.titleRequired);
    if (f.end <= f.start) return setError(t.timeOrder);
    setBusy(true);
    try {
      const patch = buildPatch();
      if (!occ) {
        await api.createMeeting({ ...patch, created_by: memberId });
      } else {
        await api.updateMeeting(occ, { ...patch, created_by: memberId }, scope);
      }
      onClose();
    } catch {
      setError(t.saveError);
      setBusy(false);
      setPending(null);
    }
  }

  async function doDelete(scope) {
    setBusy(true);
    try {
      await api.deleteMeeting(occ, scope);
      onClose();
    } catch {
      setError(t.deleteError);
      setBusy(false);
      setPending(null);
    }
  }

  function onSaveClick() {
    if (!f.title.trim()) return setError(t.titleRequired);
    if (f.end <= f.start) return setError(t.timeOrder);
    if (isRecurring) setPending('save');
    else doSave('series');
  }
  function onDeleteClick() {
    if (isRecurring) setPending('delete');
    else doDelete('series');
  }

  const title = !occ ? t.newMeeting : editing ? t.editMeeting : m.title;

  // בחירת היקף לפגישה מחזורית
  if (pending) {
    return (
      <Modal title={pending === 'delete' ? t.deleteMeeting : t.editMeeting} onClose={() => setPending(null)}>
        <p className="mb-4 text-sm text-inkSoft">{t.scopeQuestion}</p>
        <div className="flex flex-col gap-2">
          <Button disabled={busy} onClick={() => (pending === 'delete' ? doDelete('one') : doSave('one'))}>
            {t.scopeOne}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => (pending === 'delete' ? doDelete('series') : doSave('series'))}>
            {t.scopeSeries}
          </Button>
          <Button variant="ghost" onClick={() => setPending(null)}>{he.common.cancel}</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={title} onClose={onClose}>
      {editing ? (
        <div className="space-y-4">
          <Field label={t.fTitle} value={f.title} onChange={set('title')} />

          <Field label={t.fDate} type="date" value={f.date} onChange={set('date')} />
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.fStart} type="time" value={f.start} onChange={set('start')} />
            <Field label={t.fEnd} type="time" value={f.end} onChange={set('end')} />
          </div>

          <Select label={`${t.fClient} ${he.common.optional}`} value={f.client_id} onChange={set('client_id')}>
            <option value="">{t.noClient}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Field label={`${t.fLocation} ${he.common.optional}`} value={f.location} onChange={set('location')} />
          <Field label={`${t.fNotes} ${he.common.optional}`} value={f.notes} onChange={set('notes')} />

          <Select label={t.fRecurrence} value={f.recurrence} onChange={set('recurrence')}>
            {RECS.map((r) => (
              <option key={r} value={r}>{t.recurrence[r]}</option>
            ))}
          </Select>
          {f.recurrence !== 'none' && (
            <Field label={`${t.fUntil} ${he.common.optional}`} type="date" value={f.until ?? ''} onChange={set('until')} />
          )}

          {error && <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={onSaveClick} disabled={busy}>{busy ? he.common.loading : he.common.save}</Button>
            <Button variant="ghost" onClick={occ ? () => setEditing(false) : onClose}>{he.common.cancel}</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Row label={t.fWhen} value={`${f.date} · ${f.start}–${f.end}`} />
          {m.client?.name && <Row label={t.fClient} value={m.client.name} />}
          {m.location && <Row label={t.fLocation} value={m.location} />}
          {m.recurrence !== 'none' && <Row label={t.fRecurrence} value={t.recurrence[m.recurrence]} />}
          {m.notes && <Row label={t.fNotes} value={m.notes} />}

          {error && <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={() => setEditing(true)}>{he.common.edit}</Button>
            <Button variant="danger" onClick={onDeleteClick} disabled={busy}>{he.common.delete}</Button>
            <Button variant="ghost" onClick={onClose}>{he.common.close}</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="rounded-lg bg-surface p-3">
      <div className="text-xs text-grayLight">{label}</div>
      <div className="mt-1 whitespace-pre-wrap font-bold text-navy">{value}</div>
    </div>
  );
}
