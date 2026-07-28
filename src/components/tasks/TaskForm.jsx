import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Textarea from '../shared/Textarea';
import Select from '../shared/Select';
import RequirementsEditor from './RequirementsEditor';
import TaskTargetPicker from './TaskTargetPicker';

const t = he.tasks;

// המרה מ-datetime-local (זמן מקומי) ל-ISO עבור timestamptz, או null
function toIso(local) {
  return local ? new Date(local).toISOString() : null;
}

// טופס פתיחת משימה. הלקוח הוא העוגן (v8 §3.4): לקוח חובה, פרויקט רשות.
// target — { clients, projects, requireProject, quickCreateClient } מ-useTaskTargets.
// lockedClient/lockedProject — יצירה מתוך הקשר (כרטיס לקוח / פרויקט).
export default function TaskForm({
  members,
  onSubmit,
  onCancel,
  target,
  initialClientId = '',
  initialProjectId = '',
  lockedClient = false,
  lockedProject = false,
}) {
  const [clientId, setClientId] = useState(initialClientId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueAt, setDueAt] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [estMinutes, setEstMinutes] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [requiredWorkers, setRequiredWorkers] = useState('1');
  const [teamLeadId, setTeamLeadId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const workers = Math.max(1, parseInt(requiredWorkers, 10) || 1);
  const isTeam = workers > 1;

  // בחירת לקוח אחר מאפסת פרויקט שכבר לא שייך לו
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
        due_at: toIso(dueAt),
        scheduled_start_at: toIso(scheduledStart),
        est_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
        requirements: requirements.map((r) => r.trim()).filter(Boolean),
        required_workers: workers,
        team_lead_id: isTeam ? teamLeadId || null : null,
      });
    } catch {
      setError(he.common.saveError);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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

      <Select label={t.assignee} value={assigneeId} onChange={setAssigneeId}>
        <option value="">{t.unassigned}</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.full_name}
          </option>
        ))}
      </Select>

      <Select label={t.priority} value={priority} onChange={setPriority}>
        <option value="normal">{t.priorityOpt.normal}</option>
        <option value="urgent">{t.priorityOpt.urgent}</option>
      </Select>

      <Field
        label={t.dueAt}
        type="datetime-local"
        value={dueAt}
        onChange={setDueAt}
      />
      <Field
        label={`${t.scheduledStart} ${he.common.optional}`}
        type="datetime-local"
        value={scheduledStart}
        onChange={setScheduledStart}
      />
      <Field
        label={`${t.estMinutes} ${he.common.optional}`}
        type="number"
        inputMode="numeric"
        value={estMinutes}
        onChange={setEstMinutes}
      />

      <RequirementsEditor items={requirements} onChange={setRequirements} />

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
