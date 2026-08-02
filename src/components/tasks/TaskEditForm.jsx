import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import Field from '../ui/Field';
import RequirementsEditor from './RequirementsEditor';
import TaskTargetPicker from './TaskTargetPicker';
import CustomFieldInput from './CustomFieldInput';
import { useCustomFields } from '../../hooks/useCustomFields';
import { useCustomFieldValues } from '../../hooks/useCustomFieldValues';
import { saveCustomValues } from '../../lib/customFieldHelpers';
import { datesFromForm, DEFAULT_DUE_TIME, DEFAULT_START_TIME } from '../../lib/taskDates';

const t = he.tasks;

const BASE_SECTIONS = [
  { key: 'details', label: t.section.details },
  { key: 'dates', label: t.section.dates },
  { key: 'urgent', label: t.section.urgent },
  { key: 'requirements', label: t.section.requirements },
];

const CHIP = 'min-h-touch rounded-full px-4 text-sm font-bold transition-colors';
const CHIP_ON = CHIP + ' bg-brand/10 text-brand';
const CHIP_OFF = CHIP + ' bg-slate-100 text-slate-600 hover:bg-slate-200';

const DATE_INPUT =
  'min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-slate-900 ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20';

function initialOpen(task) {
  const s = new Set();
  if (task.description || task.address) s.add('details');
  // dates always have server defaults — open if not the default pair
  if (task.starts_on || task.ends_on) s.add('dates');
  if (task.priority === 'urgent') s.add('urgent');
  if (task.requirements?.length) s.add('requirements');
  return s;
}

export default function TaskEditForm({ task, members, target, orgId, onSave, onCancel }) {
  const { fields: customFields } = useCustomFields(orgId, 'task');
  const { values: savedValues } = useCustomFieldValues(orgId, 'task', task.id);
  const [clientId, setClientId] = useState(task.client_id ?? '');
  const [projectId, setProjectId] = useState(task.project_id ?? '');
  const [title, setTitle] = useState(task.title ?? '');
  const [description, setDescription] = useState(task.description ?? '');
  const [address, setAddress] = useState(task.address ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '');
  const [priority, setPriority] = useState(task.priority ?? 'normal');
  const [startDate, setStartDate] = useState(task.starts_on ?? '');
  const [startTime, setStartTime] = useState((task.start_time ?? DEFAULT_START_TIME).slice(0, 5));
  const [endDate, setEndDate] = useState(task.ends_on ?? '');
  const [endTime, setEndTime] = useState((task.due_time ?? DEFAULT_DUE_TIME).slice(0, 5));
  const [estMinutes, setEstMinutes] = useState(task.est_minutes ?? '');
  const [requirements, setRequirements] = useState(task.requirements ?? []);
  const [customEdits, setCustomEdits] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const SECTIONS = customFields.length > 0
    ? [...BASE_SECTIONS, { key: 'custom', label: t.section.custom }]
    : BASE_SECTIONS;

  const [open, setOpen] = useState(() => initialOpen(task));

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
    if (!title.trim()) return setError(t.titleRequired);

    setBusy(true);
    try {
      await onSave({
        client_id: clientId,
        project_id: projectId || null,
        title: title.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        assignee_id: assigneeId || null,
        priority,
        ...datesFromForm({ startDate, startTime, endDate, endTime }),
        est_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
        requirements: (requirements ?? []).map((r) => r.trim()).filter(Boolean),
      });
      if (Object.keys(customEdits).length > 0) {
        await saveCustomValues(orgId, 'task', task.id, customEdits);
      }
    } catch (err) {
      setError(String(err?.message ?? '').includes('not_manager') ? t.notManager : t.saveFailed);
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
            </span>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className={DATE_INPUT + ' flex-[3]'} />
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className={DATE_INPUT + ' flex-[2]'} />
            </div>
          </div>
          <div>
            <span className="mb-2 flex items-baseline gap-2 text-base font-medium text-slate-700">
              {t.endLabel}
            </span>
            <div className="flex gap-2">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className={DATE_INPUT + ' flex-[3]'} />
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className={DATE_INPUT + ' flex-[2]'} />
            </div>
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

      {open.has('custom') && customFields.length > 0 && (
        <div className="space-y-4">
          {customFields.map((f) => (
            <CustomFieldInput
              key={f.id}
              def={f}
              value={customEdits[f.id] ?? savedValues[f.id] ?? ''}
              onChange={(v) => setCustomEdits((prev) => ({ ...prev, [f.id]: v }))}
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
