import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import ClientForm from '../clients/ClientForm';
import NewTaskModal from './NewTaskModal';

const MANAGER = ['project_manager', 'work_manager'];

// פעולות מהירות בפס — למנהלים בלבד (RLS ממילא חוסם כתיבה לעובד).
export default function QuickActions({ vertical = false, onDone }) {
  const { member } = useOrg();
  const [modal, setModal] = useState(null); // 'task' | 'client'

  if (!MANAGER.includes(member?.role)) return null;

  async function addClient(fields) {
    const { error } = await supabase
      .from('clients')
      .insert({ org_id: member.org_id, ...fields });
    if (error) throw error;
    setModal(null);
    onDone?.();
  }

  const btn = 'min-h-[44px] rounded-lg px-3 text-sm font-bold whitespace-nowrap';

  return (
    <div className={vertical ? 'flex flex-col gap-2' : 'flex items-center gap-2'}>
      <button type="button" onClick={() => setModal('task')} className={`${btn} bg-brandYellow text-navy`}>
        {he.shell.newTask}
      </button>
      <button type="button" onClick={() => setModal('client')} className={`${btn} bg-white/10 text-white`}>
        {he.shell.newClient}
      </button>

      {modal === 'client' && (
        <Modal title={he.clients.addTitle} onClose={() => setModal(null)}>
          <ClientForm onSubmit={addClient} onCancel={() => setModal(null)} />
        </Modal>
      )}
      {modal === 'task' && (
        <NewTaskModal
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null);
            onDone?.();
          }}
        />
      )}
    </div>
  );
}
