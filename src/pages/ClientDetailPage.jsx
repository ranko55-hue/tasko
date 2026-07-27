import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useClient } from '../hooks/useClients';
import { useProjects } from '../hooks/useProjects';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import ProjectList from '../components/projects/ProjectList';
import ProjectForm from '../components/projects/ProjectForm';

// מסך לקוח — פרטיו + רשימת פרויקטים + הוספת פרויקט
export default function ClientDetailPage() {
  const { clientId } = useParams();
  const { member } = useOrg();
  const { client } = useClient(clientId);
  const { projects, loading, addProject } = useProjects(clientId, member.org_id);
  const [open, setOpen] = useState(false);

  async function handleSubmit(fields) {
    await addProject(fields);
    setOpen(false);
  }

  return (
    <div>
      <Link to="/clients" className="text-base font-medium text-brand hover:underline">
        › {he.clients.title}
      </Link>

      <div className="mb-5 mt-2 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {client?.name ?? he.common.loading}
        </h1>
        <div className="w-44">
          <Button onClick={() => setOpen(true)}>{he.projects.add}</Button>
        </div>
      </div>

      <h2 className="mb-3 text-xl font-bold text-slate-700">
        {he.projects.title}
      </h2>

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <ProjectList projects={projects} />
      )}

      {open && (
        <Modal title={he.projects.addTitle} onClose={() => setOpen(false)}>
          <ProjectForm onSubmit={handleSubmit} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
