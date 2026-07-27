import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useClient } from '../hooks/useClients';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useClientDetail } from '../hooks/useClientDetail';
import { he } from '../locales/he';
import ClientHeaderCard from '../components/clients/ClientHeaderCard';
import ClientTabs from '../components/clients/ClientTabs';
import GeneralTab from '../components/clients/GeneralTab';
import TasksTab from '../components/clients/TasksTab';
import ProjectsTab from '../components/clients/ProjectsTab';
import FinancesTab from '../components/clients/FinancesTab';

// מסך לקוח — כרטיס אחד עם 4 לשוניות פנימיות שמחליפות תוכן במקום.
export default function ClientDetailPage() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { member } = useOrg();
  const { client } = useClient(clientId);
  const { members } = useOrgMembers(member.org_id);
  const d = useClientDetail(clientId, member.org_id);
  const [tab, setTab] = useState('general');

  function renderTab() {
    if (tab === 'general') return <GeneralTab client={client} />;
    if (d.error)
      return (
        <p className="py-8 text-center text-red-600">
          {he.clientDetail.loadError}
        </p>
      );
    if (d.loading)
      return <p className="py-8 text-center text-slate-500">{he.common.loading}</p>;
    if (tab === 'tasks')
      return (
        <TasksTab
          tasks={d.tasks}
          members={members}
          onOpenTask={(t) => navigate(`/projects/${t.project_id}`)}
        />
      );
    if (tab === 'projects')
      return (
        <ProjectsTab
          projects={d.projects}
          openTaskCountByProject={d.openTaskCountByProject}
          onAddProject={d.addProject}
          onOpenProject={(p) => navigate(`/projects/${p.id}`)}
        />
      );
    return <FinancesTab documents={d.documents} onAddDocument={d.addDocument} />;
  }

  return (
    <div>
      <Link
        to="/clients"
        className="text-base font-medium text-brand hover:underline"
      >
        ‹ {he.clients.title}
      </Link>

      <div className="mt-2 overflow-hidden rounded-2xl bg-white shadow-sm">
        <ClientHeaderCard
          client={client}
          openProjects={d.openProjectCount}
          openTasks={d.openTaskCount}
        />
        <ClientTabs active={tab} onChange={setTab} />
        <div className="p-4">{renderTab()}</div>
      </div>
    </div>
  );
}
