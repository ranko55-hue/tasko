import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { useTaskTargets } from '../../hooks/useTaskTargets';
import { splitCustomValues, saveCustomValues } from '../../lib/customFieldHelpers';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import TaskForm from '../tasks/TaskForm';

export default function NewTaskModal({ onClose, onDone }) {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const target = useTaskTargets(member.org_id);

  async function submit(fields) {
    const { taskFields, customValues } = splitCustomValues(fields);
    const { data, error } = await supabase
      .from('tasks')
      .insert({ org_id: member.org_id, created_by: member.id, ...taskFields })
      .select('id')
      .single();
    if (error) throw error;
    await saveCustomValues(member.org_id, 'task', data.id, customValues);
    onDone();
  }

  return (
    <Modal title={he.shell.newTaskTitle} onClose={onClose}>
      {target.loading ? (
        <p className="py-6 text-center text-slate-500">{he.common.loading}</p>
      ) : target.clients.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{he.tasks.noClients}</p>
      ) : (
        <TaskForm
          members={members}
          target={target}
          orgId={member.org_id}
          onSubmit={submit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
