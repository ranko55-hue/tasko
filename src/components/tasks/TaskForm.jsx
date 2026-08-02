import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Textarea from '../shared/Textarea';
import Select from '../shared/Select';
import RequirementsEditor from './RequirementsEditor';
import TaskTargetPicker from './TaskTargetPicker';
import CustomFieldInput from './CustomFieldInput';
import { useCustomFields } from '../../hooks/useCustomFields';
import { datesFromForm } from '../../lib/taskDates';

const t = he.tasks;

const BASE_SECTIONS = [
  { key: 'details', label: t.section.details },
  { key: 'dates', label: t.section.dates },
  { key: 'urgent', label: t.section.urgent },
  { key: 'requirements', label: t.section.requirements },
  { key: 'team', label: t.section.team },
];

const CHIP = 'min-h-touch rounded-full px-4 text-sm font-bold transition-colors';
const CHIP_ON = CHIP + ' bg-brand/10 text-brand';
const CHIP_OFF = CHIP + ' bg-slate-100 text-slate-600 hover:bg-slate-200';

const DATE_INPUT =
  'min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-slate-900 ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20';

// טופס פתיחת משימה — חשיפה מדורגת.
// ברירת מחדל: כותרת + לקוח + שיוך בלבד. שאר האפשרויות מאחורי מתגים.
export default function TaskForm({
  members,
  onSubmit,
  onCancel,
  target,
  orgId,
  initialClientId = '',
  initialProjectId = '',
  lockedClient = false,
  lockedProject = false,
}) {
  const { fields: customFields } = useCustomFields(orgId, 'task');
  const [clientId, setClientId] = useState(initialClientId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estMinutes, setEstMinutes] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [requiredWorkers, setRequiredWorkers] = useState('1');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [customValues, setCustomValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const SECTIONS = customFields.length > 0
    ? [...BASE_SECTIONS, { key: 'custom', label: t.section.custom }]
    : BASE_SECTIONS;

  const [open, setOpen] = useState(new Set());

  const workers = Math.max(1, parseInt(requiredWorkers, 10) || 1);
  const isTeam = workers > 1;

  function toggle(key) {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function changeClient(id) {
    setClientId(id);
    const stillValid = target?.projects?.some((p) => p.id === projectId && p.client_id === id);
    if (!stillValid) setProjectId('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!clientId) return setError(t.clientRequired);
    if (target?.requireProject && !projectId) return setError(t.projectRequired);
    if (!title.trim()) return setError(t.titleRequired);

    setBusy(true);
    try {
      await onSubmit({
        client_id: clientId,
        project_id: projectId || null,
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        assignee_id: assigneeId || null,
        priority,
        ...datesFromForm({ startDate, startTime, endDate, endTime }),
        est_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
        requirements: requirements.map((r) => r.trim()).filter(Boolean),
        required_workers: workers,
        team_lead_id: isTeam ? teamLeadId || null : null,
        _customValues: customValues,
      });
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* === שכבה ראשית — תמיד גלויה === */}
      {target && (
        <TaskTargetPicker
          clients={target.clients}
          projects={target.projects}
          clientId={clientId}
          projectId={projectId}
          onClientChange={changeClient}
          onProjectChange={setProjectId}
          onQuickClient={async (fields) => {
            const created = await target.quickCreateClient(fields);
            changeClient(created.id);
          }}
          requireProject={target.requireProject}
          lockedClient={lockedClient}
          lockedProject={lockedProject}
        />
      )}

      <Field label={t.fieldTitle} value={title} onChange={setTitle} />

      <Select label={t.assignee} value={assigneeId} onChange={setAssigneeId}>
        <option value="">{t.unassigned}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </Select>

      {/* === מתגי חשיפה מדורגת === */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={open.has(key) ? CHIP_ON : CHIP_OFF}
          >
            {label}
          </button>
        ))}
      </div>

      {/* === מקטעים מתרחבים === */}
      {open.has('details') && (
        <div className="space-y-4">
          <Textarea
            label={`${t.description} ${he.common.optional}`}
            value={description}
            onChange={setDescription}
          />
          <Field
            label={`${t.address} ${he.common.optional}`}
            value={address}
            onChange={setAddress}
          />
        </div>
      )}

      {open.has('dates') && (
        <div className="space-y-3">
          <div>
            <span className="mb-2 flex items-baseline gap-2 text-base font-medium text-slate-700">
              {t.startLabel}
              <span className="text-xs text-slate-400">{he.common.optional}</span>
            </span>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={DATE_INPUT + ' flex-[3]'} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className={DATE_INPUT + ' flex-[2]'} />
            </div>
            {!startDate && !startTime && (
              <p className="mt-1 text-xs text-slate-400">{t.startDefault}</p>
            )}
          </div>
          <div>
            <span className="mb-2 flex items-baseline gap-2 text-base font-medium text-slate-700">
              {t.endLabel}
              <span className="text-xs text-slate-400">{he.common.optional}</span>
            </span>
            <div className="flex gap-2">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className={DATE_INPUT + ' flex-[3]'} />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className={DATE_INPUT + ' flex-[2]'} />
            </div>
            {!endDate && !endTime && (
              <p className="mt-1 text-xs text-slate-400">{t.endDefault}</p>
            )}
          </div>
          <Field
            label={`${t.estMinutes} ${he.common.optional}`}
            type="number"
            inputMode="numeric"
            value={estMinutes}
            onChange={setEstMinutes}
          />
        </div>
      )}

      {open.has('urgent') && (
        <Select label={t.priority} value={priority} onChange={setPriority}>
          <option value="normal">{t.priorityOpt.normal}</option>
          <option value="urgent">{t.priorityOpt.urgent}</option>
        </Select>
      )}

      {open.has('requirements') && (
        <RequirementsEditor items={requirements} onChange={setRequirements} />
      )}

      {open.has('team') && (
        <div className="space-y-4">
          <Field
            label={t.requiredWorkers}
            type="number"
            inputMode="numeric"
            value={requiredWorkers}
            onChange={setRequiredWorkers}
          />
          {isTeam && (
            <Select label={t.teamLead} value={teamLeadId} onChange={setTeamLeadId}>
              <option value="">{he.common.none}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}

      {open.has('custom') && customFields.length > 0 && (
        <div className="space-y-4">
          {customFields.map((f) => (
            <CustomFieldInput
              key={f.id}
              def={f}
              value={customValues[f.id] ?? ''}
              onChange={(v) => setCustomValues((prev) => ({ ...prev, [f.id]: v }))}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={busy}>
          {busy ? he.common.loading : he.common.save}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    </form>
  );
}
