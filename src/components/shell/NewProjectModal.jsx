import { useEffect, useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { useOrgMembers } from '../../hooks/useOrgMembers';
import { useTaskTargets } from '../../hooks/useTaskTargets';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import Select from '../shared/Select';
import ProjectForm from '../projects/ProjectForm';

// פרויקט חדש מהפס העליון — בוחרים לקוח (חובה) ואז טופס הפרויקט הרגיל.
// אותה הכנסה כמו יצירת פרויקט תחת לקוח (org_id + client_id + שדות הטופס).
export default function NewProjectModal({ onClose, onDone }) {
  const { member } = useOrg();
  const { members } = useOrgMembers(member.org_id);
  const { clients, loading } = useTaskTargets(member.org_id);
  const [clientId, setClientId] = useState('');

  // ברירת מחדל — הלקוח הראשון, כדי שתמיד יש לקוח תקין
  useEffect(() => {
    if (clients.length && !clientId) setClientId(clients[0].id);
  }, [clients, clientId]);

  async function submit(fields) {
    const { error } = await supabase
      .from('projects')
      .insert({ org_id: member.org_id, client_id: clientId, ...fields });
    if (error) throw error;
    onDone();
  }

  return (
    <Modal title={he.projects.addTitle} onClose={onClose}>
      {loading ? (
        <p className="py-6 text-center text-grayMid">{he.common.loading}</p>
      ) : clients.length === 0 ? (
        <p className="py-6 text-center text-grayMid">{he.tasks.noClients}</p>
      ) : (
        <div className="space-y-4">
          <Select label={he.tasks.client} value={clientId} onChange={setClientId}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <ProjectForm members={members} onSubmit={submit} onCancel={onClose} />
        </div>
      )}
    </Modal>
  );
}
