import { useState } from 'react';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import Field from '../ui/Field';
import Select from '../shared/Select';
import Button from '../shared/Button';
import OptionsEditor from './OptionsEditor';

const cf = he.customFields;

const TYPES = ['text', 'number', 'date', 'select'];
const ENTITIES = ['task', 'project', 'client'];
const PERMISSIONS = ['everyone', 'manager', 'admin'];

export default function FieldFormModal({ initial, onSave, onClose, lockedEntity }) {
  const editing = !!initial;
  const [label, setLabel] = useState(initial?.label ?? '');
  const [fieldType, setFieldType] = useState(initial?.field_type ?? 'text');
  const [entity, setEntity] = useState(initial?.entity ?? lockedEntity ?? 'task');
  const [isRequired, setIsRequired] = useState(initial?.is_required ?? false);
  const [minRole, setMinRole] = useState(initial?.min_role ?? 'everyone');
  const [options, setOptions] = useState(initial?.options ?? []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!label.trim()) return setError(he.common.required);
    if (fieldType === 'select' && options.filter(Boolean).length === 0) {
      return setError(cf.options.empty);
    }

    setBusy(true);
    try {
      await onSave({
        label: label.trim(),
        field_type: fieldType,
        entity,
        is_required: isRequired,
        min_role: minRole,
        options: fieldType === 'select' ? options.filter(Boolean) : [],
      });
      onClose();
    } catch {
      setError(cf.saveFailed);
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? cf.editField : cf.addField} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field
          label={cf.fieldLabel}
          value={label}
          onChange={setLabel}
          placeholder={cf.fieldLabelPlaceholder}
        />

        <Select
          label={cf.fieldType}
          value={fieldType}
          onChange={setFieldType}
          disabled={editing}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{cf.types[t]}</option>
          ))}
        </Select>

        <Select label={cf.fieldEntity} value={entity} onChange={setEntity} disabled={editing || !!lockedEntity}>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>{cf.entities[e]}</option>
          ))}
        </Select>

        <Select label={cf.fieldPermission} value={minRole} onChange={setMinRole}>
          {PERMISSIONS.map((p) => (
            <option key={p} value={p}>{cf.permissions[p]}</option>
          ))}
        </Select>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-5 w-5 rounded border-lineDark text-brand focus:ring-2 focus:ring-brand/30"
          />
          <span className="font-bold text-navy">{cf.fieldRequired}</span>
        </label>

        {fieldType === 'select' && (
          <OptionsEditor options={options} onChange={setOptions} />
        )}

        {error && (
          <p className="rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={busy}>
            {busy ? he.common.loading : he.common.save}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
