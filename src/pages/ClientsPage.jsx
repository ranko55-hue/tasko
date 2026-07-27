import { useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { useClients } from '../hooks/useClients';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ClientList from '../components/clients/ClientList';
import ClientForm from '../components/clients/ClientForm';

// מסך לקוחות — רשימה + הוספה
export default function ClientsPage() {
  const { member } = useOrg();
  const { clients, loading, addClient } = useClients(member.org_id);
  const [open, setOpen] = useState(false);

  async function handleSubmit(fields) {
    await addClient(fields);
    setOpen(false);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {he.clients.title}
        </h1>
        <div className="w-40">
          <Button onClick={() => setOpen(true)}>{he.clients.add}</Button>
        </div>
      </div>

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <ClientList clients={clients} />
      )}

      {open && (
        <Modal title={he.clients.addTitle} onClose={() => setOpen(false)}>
          <ClientForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
