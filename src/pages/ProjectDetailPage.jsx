import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useProject } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useBlockReasons } from '../hooks/useBlockReasons';
import { unblockTask } from '../lib/taskFlow';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PageShell from '../components/ui/PageShell';
import PageHeader from '../components/ui/PageHeader';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';

// מסך פרויקט — משימות + פתיחת משימה (תמיד בהקשר הפרויקט)
export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { member } = useOrg();
  const { project } = useProject(projectId);
  const { members } = useOrgMembers(member.org_id);
  const { tasks, loading, addTask, applyLocal } = useTasks(
    projectId,
    member.org_id,
    member.id
  );
  const reasons = useBlockReasons(tasks);
  const [open, setOpen] = useState(false);

  async function handleSubmit(fields) {
    await addTask(fields);
    setOpen(false);
  }

  async function handleReturnToWork(task) {
    applyLocal(await unblockTask(task, member.id));
  }

  const client = project?.client;

  return (
    <PageShell>
      {client && (
        <Link
          to={`/clients/${client.id}`}
          className="text-base font-medium text-brand hover:underline"
        >
          ‹ {client.name}
        </Link>
      )}

      <PageHeader
        title={project?.name ?? he.common.loading}
        subtitle={he.tasks.title}
        actions={
          <div className="w-44">
            <Button onClick={() => setOpen(true)}>{he.tasks.add}</Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <TaskList
          tasks={tasks}
          members={members}
          reasons={reasons}
          onReturnToWork={handleReturnToWork}
        />
      )}

      {open && (
        <Modal title={he.tasks.addTitle} onClose={() => setOpen(false)}>
          <TaskForm
            members={members}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </PageShell>
  );
}
