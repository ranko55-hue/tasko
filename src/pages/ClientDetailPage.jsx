import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useClient } from '../hooks/useClients';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useClientDetail } from '../hooks/useClientDetail';
import { useTaskTargets } from '../hooks/useTaskTargets';
import { supabase } from '../lib/supabase';
import { he } from '../locales/he';
import Modal from '../components/shared/Modal';
import TaskForm from '../components/tasks/TaskForm';
import Card from '../components/ui/Card';
import Tabs from '../components/ui/Tabs';
import ClientHeaderCard from '../components/clients/ClientHeaderCard';
import GeneralTab from '../components/clients/GeneralTab';
import TasksTab from '../components/clients/TasksTab';
import ProjectsTab from '../components/clients/ProjectsTab';
import FinancesTab from '../components/clients/FinancesTab';
import TaskDrawer from '../components/tasks/TaskDrawer';

const TABS = ['general', 'tasks', 'projects', 'finance'];

// מסך לקוח — כרטיס אחד עם 4 לשוניות פנימיות שמחליפות תוכן במקום.
// TaskDrawer נפתח כשלוחצים על משימה (לא ניווט לעמוד אחר)
export default function ClientDetailPage() {
  const { clientId } = useParams();
  const { member } = useOrg();
  const { client } = useClient(clientId);
  const { members } = useOrgMembers(member.org_id);
  const d = useClientDetail(clientId, member.org_id);
  const target = useTaskTargets(member.org_id);
  const [tab, setTab] = useState('general');
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const isManager = ['project_manager', 'work_manager'].includes(member.role);

  // יצירה מתוך הקשר הלקוח — הלקוח נעול, הפרויקט נבחר מבין פרויקטי הלקוח
  async function createTask(fields) {
    const { error } = await supabase.from('tasks').insert({
      org_id: member.org_id,
      created_by: member.id,
      ...fields,
    });
    if (error) throw error;
    setNewTaskOpen(false);
    d.refetch();
  }

  const tabItems = TABS.map((key) => ({
    key,
    label: he.clientDetail.tabs[key],
  }));

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
          onOpenTask={(t) => setSelectedTaskId(t.id)}
          onNewTask={() => setNewTaskOpen(true)}
        />
      );
    if (tab === 'projects')
      return (
        <ProjectsTab
          projects={d.projects}
          openTaskCountByProject={d.openTaskCountByProject}
          onAddProject={d.addProject}
          onOpenProject={(p) => {
            // פתיחת DrawerTasksTab של פרויקט
          }}
        />
      );
    return <FinancesTab documents={d.documents} onAddDocument={d.addDocument} />;
  }

  return (
    <>
      <Link
        to="/clients"
        className="text-base font-medium text-brand hover:underline"
      >
        ‹ {he.clients.title}
      </Link>

      <Card className="mt-2 overflow-hidden">
        <ClientHeaderCard
          client={client}
          openProjects={d.openProjectCount}
          openTasks={d.openTaskCount}
          onNewTask={() => setNewTaskOpen(true)}
        />
        <Tabs tabs={tabItems} active={tab} onChange={setTab} />
        <div className="p-4">{renderTab()}</div>
      </Card>

      {newTaskOpen && (
        <Modal title={he.tasks.addTitle} onClose={() => setNewTaskOpen(false)}>
          <TaskForm
            members={members}
            target={target}
            initialClientId={clientId}
            lockedClient
            onSubmit={createTask}
            onCancel={() => setNewTaskOpen(false)}
          />
        </Modal>
      )}

      {/* TaskDrawer — פתיחה מכל מקום */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        orgId={member.org_id}
        isManager={isManager}
      />
    </>
  );
}
