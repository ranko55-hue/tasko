import { useEffect, useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import TaskForm from '../tasks/TaskForm';

// משימה חדשה מהפס — בוחרים פרויקט (אין משימות באוויר) ואז טופס המשימה.
export default function NewTaskModal({ onClose, onDone }) {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name, client:clients(name)')
      .eq('org_id', member.org_id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProjects(data ?? []);
        if (data?.length) setProjectId(data[0].id);
      });
  }, [member.org_id]);

  async function submit(fields) {
    const { error } = await supabase.from('tasks').insert({
      org_id: member.org_id,
      project_id: projectId,
      created_by: member.id,
      ...fields,
    });
    if (error) throw error;
    onDone();
  }

  return (
    <Modal title={he.shell.newTaskTitle} onClose={onClose}>
      {projects.length === 0 ? (
        <p className="py-6 text-center text-slate-500">{he.shell.noProjects}</p>
      ) : (
        <div className="space-y-4">
          <Select label={he.shell.pickProject} value={projectId} onChange={setProjectId}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.client?.name ? `${p.client.name} · ${p.name}` : p.name}
              </option>
            ))}
          </Select>
          <TaskForm members={members} onSubmit={submit} onCancel={onClose} />
        </div>
      )}
    </Modal>
  );
}
