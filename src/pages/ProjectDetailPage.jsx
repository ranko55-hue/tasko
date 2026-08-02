import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useProject } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useOrgMembers } from '../hooks/useOrgMembers';
import { useBlockReasons } from '../hooks/useBlockReasons';
import { useTaskTargets } from '../hooks/useTaskTargets';
import { unblockTask } from '../lib/taskFlow';
import { splitCustomValues, saveCustomValues } from '../lib/customFieldHelpers';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/ui/PageHeader';
import RefNumber from '../components/shared/RefNumber';
import Card from '../components/ui/Card';
import Icon from '../components/ui/Icon';
import Tabs from '../components/ui/Tabs';
import ProjectGeneralTab from '../components/projects/ProjectGeneralTab';
import ProjectFilesTab from '../components/projects/ProjectFilesTab';
import TaskList from '../components/tasks/TaskList';
import TaskForm from '../components/tasks/TaskForm';
import TaskDrawer from '../components/tasks/TaskDrawer';
import { isManager } from '../lib/roles';

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
  const target = useTaskTargets(member.org_id);
  const [open, setOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [tab, setTab] = useState('tasks'); // משימות היא ברירת המחדל

  const manager = isManager(member);

  // "קבצים" מוסתרת מעובד גם ב-UI; ההגנה עצמה ב-RLS (מיגרציה 012)
  const tabItems = ['tasks', 'general', ...(manager ? ['files'] : [])].map((key) => ({
    key,
    label: he.projectDetail.tabs[key],
  }));

  async function handleSubmit(fields) {
    const { taskFields, customValues } = splitCustomValues(fields);
    const created = await addTask(taskFields);
    if (created?.id) {
      await saveCustomValues(member.org_id, 'task', created.id, customValues);
    }
    setOpen(false);
  }

  async function handleReturnToWork(task) {
    applyLocal(await unblockTask(task, member.id));
  }

  const client = project?.client;

  return (
    <>
      {client && (
        <Link
          to={`/clients/${client.id}`}
          className="text-base font-medium text-brand hover:underline"
        >
          <Icon name="back" size="sm" className="inline-block" /> {client.name}
        </Link>
      )}

      <PageHeader
        title={
          <span className="flex items-baseline gap-2">
            <span className="min-w-0 truncate">{project?.name ?? he.common.loading}</span>
            <RefNumber value={project?.number} className="shrink-0 text-base font-bold" />
          </span>
        }
        actions={
          tab === 'tasks' ? (
            <div className="w-44">
              <Button onClick={() => setOpen(true)}>{he.tasks.add}</Button>
            </div>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <Tabs tabs={tabItems} active={tab} onChange={setTab} />
        <div className="p-4">
          {tab === 'general' && <ProjectGeneralTab project={project} />}
          {tab === 'files' && manager && (
            <ProjectFilesTab project={project} memberId={member.id} />
          )}
          {tab === 'tasks' &&
            (loading ? (
              <p className="text-lg text-slate-500">{he.common.loading}</p>
            ) : (
              <TaskList
                onOpenTask={setSelectedTaskId}
                tasks={tasks}
                members={members}
                reasons={reasons}
                onReturnToWork={handleReturnToWork}
              />
            ))}
        </div>
      </Card>

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        orgId={member.org_id}
        isManager={isManager(member)}
      />

      {open && (
        <Modal title={he.tasks.addTitle} onClose={() => setOpen(false)}>
          <TaskForm
            members={members}
            target={target}
            orgId={member.org_id}
            initialClientId={client?.id ?? ''}
            initialProjectId={projectId}
            lockedClient
            lockedProject
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
    </>
  );
}
