import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useClients } from '../hooks/useClients';
import { useClientOverview } from '../hooks/useClientOverview';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useTaskTargets } from '../hooks/useTaskTargets';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/ui/PageHeader';
import ClientTable from '../components/clients/ClientTable';
import ClientForm from '../components/clients/ClientForm';
import TaskForm from '../components/tasks/TaskForm';

// מסך לקוחות — טבלה בדסקטופ, כרטיסים ב-390. המונים מגיעים מ-client_overview.
export default function ClientsPage() {
  const { member } = useOrg();
  const navigate = useNavigate();
  const { addClient } = useClients(member.org_id);
  const { rows, loading, error, refetch } = useClientOverview(member.org_id);
  const { members } = useOrgMembers(member.org_id);
  const target = useTaskTargets(member.org_id);

  const [addOpen, setAddOpen] = useState(false);
  const [taskForClient, setTaskForClient] = useState(null);

  async function handleAddClient(fields) {
    await addClient(fields);
    setAddOpen(false);
    refetch();
  }

  // יצירה מתוך הקשר — הלקוח של השורה מוצמד ולא ניתן לשינוי
  async function createTask(fields) {
    const { error: err } = await supabase.from('tasks').insert({
      org_id: member.org_id,
      created_by: member.id,
      ...fields,
    });
    if (err) throw err;
    setTaskForClient(null);
    refetch();
  }

  return (
    <>
      <PageHeader
        title={he.clients.title}
        actions={
          <div className="w-40">
            <Button onClick={() => setAddOpen(true)}>{he.clients.add}</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-lg text-slate-600">{he.clients.loadError}</p>
          <div className="mx-auto w-40">
            <Button onClick={refetch}>{he.common.retry}</Button>
          </div>
        </div>
      ) : (
        <ClientTable
          rows={rows}
          onOpen={(r) => navigate(`/clients/${r.id}`)}
          onNewTask={(r) => setTaskForClient(r)}
        />
      )}

      {addOpen && (
        <Modal title={he.clients.addTitle} onClose={() => setAddOpen(false)}>
          <ClientForm onSubmit={handleAddClient} onCancel={() => setAddOpen(false)} />
        </Modal>
      )}

      {taskForClient && (
        <Modal title={he.tasks.addTitle} onClose={() => setTaskForClient(null)}>
          <TaskForm
            members={members}
            target={target}
            initialClientId={taskForClient.id}
            lockedClient
            onSubmit={createTask}
            onCancel={() => setTaskForClient(null)}
          />
        </Modal>
      )}
    </>
  );
}
