import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Row from '../ui/Row';
import StatusPill from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import DocumentForm from './DocumentForm';
import Icon from '../ui/Icon';

const f = he.clientDetail.finance;

const KIND_ICON = {
  quote: 'task',
  delivery_note: 'project',
  invoice: 'finance',
  receipt: 'finance',
  other: 'task',
};

// גווני סטטוס מסמך — רק צבעי DESIGN §4
const DOC_TONE = {
  draft: 'gray',
  sent: 'blue',
  approved: 'green',
  paid: 'green',
  rejected: 'red',
};

// לשונית כספים — מסמכי client_documents, אותה Row משותפת. מצב ריק (DESIGN §5).
export default function FinancesTab({ documents, onAddDocument }) {
  const [open, setOpen] = useState(false);

  async function submit(fields) {
    await onAddDocument(fields);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="w-40">
        <Button onClick={() => setOpen(true)}>{f.add}</Button>
      </div>

      {!documents.length ? (
        <EmptyState icon="finance" message={f.empty} />
      ) : (
        <div className="space-y-3">
          {documents.map((d) => (
            <Row
              key={d.id}
              icon={<Icon name={KIND_ICON[d.kind] ?? 'task'} />}
              title={d.title}
              subtitle={
                d.amount != null
                  ? '₪' + Number(d.amount).toLocaleString('he-IL')
                  : f.kinds[d.kind]
              }
              trailing={
                <StatusPill
                  tone={DOC_TONE[d.status] ?? 'gray'}
                  label={f.statuses[d.status] ?? d.status}
                />
              }
            />
          ))}
        </div>
      )}

      {open && (
        <Modal title={f.addTitle} onClose={() => setOpen(false)}>
          <DocumentForm onSubmit={submit} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
