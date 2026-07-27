import { useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { useClients } from '../hooks/useClients';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PageShell from '../components/ui/PageShell';
import PageHeader from '../components/ui/PageHeader';
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
    <PageShell>
      <PageHeader
        title={he.clients.title}
        actions={
          <div className="w-40">
            <Button onClick={() => setOpen(true)}>{he.clients.add}</Button>
          </div>
        }
      />

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
    </PageShell>
  );
}
