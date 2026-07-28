import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Select from '../shared/Select';
import Textarea from '../shared/Textarea';
import Field from '../ui/Field';
import RequirementsEditor from './RequirementsEditor';
import TaskTargetPicker from './TaskTargetPicker';

const t = he.tasks;

// ISO ↔ datetime-local
function toLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function toIso(local) {
  return local ? new Date(local).toISOString() : null;
}

// עריכת משימה קיימת. שינוי לקוח/פרויקט מותר — האילוץ נאכף בטריגר בשרת.
// requireProject לא נאכף כאן: ההגדרה חלה על יצירה בלבד (v8 §3.9, הכרעה 2).
export default function TaskEditForm({ task, members, target, onSave, onCancel }) {
  const [clientId, setClientId] = useState(task.client_id ?? '');
  const [projectId, setProjectId] = useState(task.project_id ?? '');
  const [title, setTitle] = useState(task.title ?? '');
  const [description, setDescription] = useState(task.description ?? '');
  const [address, setAddress] = useState(task.address ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? '');
  const [priority, setPriority] = useState(task.priority ?? 'normal');
  const [dueAt, setDueAt] = useState(toLocal(task.due_at));
  const [estMinutes, setEstMinutes] = useState(task.est_minutes ?? '');
  const [requirements, setRequirements] = useState(task.requirements ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
        due_at: toIso(dueAt),
        est_minutes: estMinutes ? parseInt(estMinutes, 10) : null,
        requirements: (requirements ?? []).map((r) => r.trim()).filter(Boolean),
      });
    } catch (err) {
      // הטריגר בשרת מחזיר not_manager כשעובד מנסה לערוך
      setError(String(err?.message ?? '').includes('not_manager') ? t.notManager : t.saveFailed);
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

      <Field label={t.dueAt} type="datetime-local" value={dueAt} onChange={setDueAt} />
      <Field
        label={`${t.estMinutes} ${he.common.optional}`}
        type="number"
        inputMode="numeric"
        value={estMinutes}
        onChange={setEstMinutes}
      />

      <RequirementsEditor items={requirements} onChange={setRequirements} />

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
