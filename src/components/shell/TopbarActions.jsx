import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';
import Modal from '../shared/Modal';
import ClientForm from '../clients/ClientForm';
import NewTaskModal from './NewTaskModal';
import NewProjectModal from './NewProjectModal';

const t = he.topbar;

// כפתור אייקון בפס — tooltip בשם (title), יעד מגע 40px.
function ActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-lg text-lineDark transition-colors hover:bg-white/10 hover:text-white"
    >
      <Icon name={icon} size="md" />
    </button>
  );
}

// אייקוני פעולה מהירה בפס — מחוברים לפעולות האמיתיות של המערכת.
// פעמון = שלד להתראות (מודול טרם קיים) ולכן ללא פעולה.
export default function TopbarActions({ onDone }) {
  const { member } = useOrg();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'task' | 'client' | 'project'

  async function addClient(fields, managerIds = []) {
    const { data, error } = await supabase
      .from('clients')
      .insert({ org_id: member.org_id, ...fields })
      .select('id')
      .single();
    if (error) throw error;

    if (managerIds.length) {
      const { error: assignErr } = await supabase.from('client_managers').insert(
        managerIds.map((member_id) => ({ client_id: data.id, member_id, org_id: member.org_id })),
      );
      if (assignErr) throw assignErr;
    }
    setModal(null);
    onDone?.();
  }

  function done() {
    setModal(null);
    onDone?.();
  }

  return (
    <div className="flex items-center gap-1">
      <ActionButton icon="task" label={t.newTask} onClick={() => setModal('task')} />
      <ActionButton icon="inbox" label={t.myTasks} onClick={() => navigate('/my')} />
      <ActionButton icon="client" label={t.newClient} onClick={() => setModal('client')} />
      <ActionButton icon="project" label={t.newProject} onClick={() => setModal('project')} />
      <ActionButton icon="bell" label={t.notifications} />

      {modal === 'task' && <NewTaskModal onClose={() => setModal(null)} onDone={done} />}
      {modal === 'project' && <NewProjectModal onClose={() => setModal(null)} onDone={done} />}
      {modal === 'client' && (
        <Modal title={he.clients.addTitle} onClose={() => setModal(null)}>
          <ClientForm onSubmit={addClient} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
