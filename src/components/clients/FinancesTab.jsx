import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import DetailRow from './DetailRow';
import DocumentForm from './DocumentForm';

const f = he.clientDetail.finance;

const KIND_ICON = {
  quote: '📝',
  delivery_note: '🚚',
  invoice: '🧾',
  receipt: '💵',
  other: '📄',
};

const STATUS_STYLE = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

// לשונית כספים — מסמכי client_documents, אותה שורה משותפת. מצב ריק לפי DESIGN.
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
        <p className="py-8 text-center text-lg text-slate-400">{f.empty}</p>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <DetailRow
              key={d.id}
              icon={KIND_ICON[d.kind] ?? '📄'}
              title={d.title}
              subtitle={
                d.amount != null
                  ? '₪' + Number(d.amount).toLocaleString('he-IL')
                  : f.kinds[d.kind]
              }
              tagLabel={f.statuses[d.status] ?? d.status}
              tagClass={STATUS_STYLE[d.status] ?? ''}
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
