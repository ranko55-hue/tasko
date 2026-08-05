import { useState } from 'react';
import { he } from '../../locales/he';
import { useCustomFields } from '../../hooks/useCustomFields';
import Button from '../shared/Button';
import Tabs from '../ui/Tabs';
import FieldFormModal from './FieldFormModal';
import Icon from '../ui/Icon';

const cf = he.customFields;
const ENTITY_TABS = ['task', 'client', 'project'];

function FieldRow({ field, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg border border-line p-4">
      <div className="min-w-0">
        <span className="block font-bold text-navy">{field.label}</span>
        <span className="mt-1 block text-sm text-grayMid">
          {cf.types[field.field_type]}
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
            className="min-h-touch rounded-lg px-3 text-grayLight hover:text-statusRed"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
}

// אזור השדות המותאמים — אזור אחד עם לשוניות פר-ישות (משימה / לקוח / פרויקט).
export default function CustomFieldsManager({ orgId }) {
  const { fields, loading, createField, updateField, deleteField } =
    useCustomFields(orgId, null);
  const [entity, setEntity] = useState('task');
  const [modal, setModal] = useState(null); // null | 'new' | field object

  const forEntity = fields.filter((f) => f.entity === entity);

  async function handleSave(data) {
    if (modal && modal !== 'new') await updateField(modal.id, data);
    else await createField(data);
  }

  const tabItems = ENTITY_TABS.map((key) => ({ key, label: cf.entityTabs[key] }));

  return (
    <section>
      <h2 className="mb-1 text-sm font-black text-grayMid">{cf.sectionTitle}</h2>
      <p className="mb-3 text-sm text-grayMid">{cf.sectionHint}</p>

      <Tabs tabs={tabItems} active={entity} onChange={setEntity} />

      {loading ? (
        <p className="py-4 text-center text-grayMid">{he.common.loading}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {forEntity.length === 0 && (
            <p className="py-4 text-center text-sm text-grayLight">{cf.noFields}</p>
          )}
          {forEntity.map((f) => (
            <FieldRow key={f.id} field={f} onEdit={setModal} onDelete={deleteField} />
          ))}

          <Button variant="dashed" onClick={() => setModal('new')}>
            {cf.addField}
          </Button>
        </div>
      )}

      {modal && (
        <FieldFormModal
          initial={modal === 'new' ? null : modal}
          lockedEntity={modal === 'new' ? entity : undefined}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}
