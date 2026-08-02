import { useState } from 'react';
import { he } from '../../locales/he';
import { useCustomFields } from '../../hooks/useCustomFields';
import Button from '../shared/Button';
import FieldFormModal from './FieldFormModal';
import Icon from '../ui/Icon';

const cf = he.customFields;

function FieldRow({ field, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-xl border border-line p-4">
      <div className="min-w-0">
        <span className="block font-bold text-slate-900">{field.label}</span>
        <span className="mt-0.5 block text-sm text-slate-500">
          {cf.entities[field.entity]} · {cf.types[field.field_type]}
          {field.is_required ? ` · ${he.common.required}` : ''}
          {field.min_role !== 'everyone' ? ` · ${cf.permissions[field.min_role]}` : ''}
        </span>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" size="sm" fullWidth={false} onClick={() => onEdit(field)}>
          {he.common.edit}
        </Button>
        {confirming ? (
          <Button variant="ghostDanger" size="sm" fullWidth={false} onClick={() => { onDelete(field.id); setConfirming(false); }}>
            {cf.deleteField}
          </Button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-touch rounded-lg px-3 text-slate-400 hover:text-red-500"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomFieldsManager({ orgId }) {
  const { fields, loading, createField, updateField, deleteField } =
    useCustomFields(orgId, null);
  const [modal, setModal] = useState(null); // null | 'new' | field object

  async function handleSave(data) {
    if (modal && modal !== 'new') {
      await updateField(modal.id, data);
    } else {
      await createField(data);
    }
  }

  return (
    <section>
      <h2 className="mb-1 text-sm font-black text-slate-500">{cf.sectionTitle}</h2>
      <p className="mb-3 text-sm text-slate-500">{cf.sectionHint}</p>

      {loading ? (
        <p className="py-4 text-center text-slate-500">{he.common.loading}</p>
      ) : (
        <div className="space-y-3">
          {fields.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">{cf.noFields}</p>
          )}
          {fields.map((f) => (
            <FieldRow
              key={f.id}
              field={f}
              onEdit={setModal}
              onDelete={deleteField}
            />
          ))}

          <Button variant="dashed" onClick={() => setModal('new')}>
            {cf.addField}
          </Button>
        </div>
      )}

      {modal && (
        <FieldFormModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
