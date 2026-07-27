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
    <div>
      {client && (
        <Link
          to={`/clients/${client.id}`}
          className="text-base font-medium text-brand hover:underline"
        >
          › {client.name}
        </Link>
      )}

      <div className="mb-5 mt-2 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {project?.name ?? he.common.loading}
        </h1>
        <div className="w-44">
          <Button onClick={() => setOpen(true)}>{he.tasks.add}</Button>
        </div>
      </div>

      <h2 className="mb-3 text-xl font-bold text-slate-700">{he.tasks.title}</h2>

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
    </div>
  );
}
