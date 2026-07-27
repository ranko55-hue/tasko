import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ProjectForm from '../projects/ProjectForm';
import DetailRow from './DetailRow';
import TabSection from './TabSection';

// לשונית פרויקטים — פתוחים / סגורים, אותה שורה משותפת. תג "פעיל · N משימות".
export default function ProjectsTab({
  projects,
  openTaskCountByProject,
  onAddProject,
  onOpenProject,
}) {
  const p = he.clientDetail.projectsTab;
  const [open, setOpen] = useState(false);

  const openP = projects.filter((x) => x.status === 'open');
  const closedP = projects.filter((x) => x.status !== 'open');

  async function submit(fields) {
    await onAddProject(fields);
    setOpen(false);
  }

  const row = (x) => (
    <DetailRow
      key={x.id}
      icon="🗂️"
      title={x.name}
      subtitle={x.address}
      tagLabel={
        x.status === 'open'
          ? p.activeTag.replace('{n}', openTaskCountByProject[x.id] || 0)
          : he.projects.status.closed
      }
      tagClass={
        x.status === 'open'
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-200 text-slate-500'
      }
      onClick={() => onOpenProject(x)}
    />
  );

  return (
    <div className="space-y-4">
      <div className="w-48">
        <Button onClick={() => setOpen(true)}>{p.add}</Button>
      </div>

      {!projects.length ? (
        <p className="py-8 text-center text-slate-400">{p.empty}</p>
      ) : (
        <div className="space-y-6">
          <TabSection title={p.open.replace('{n}', openP.length)}>
            {openP.map(row)}
          </TabSection>
          {closedP.length > 0 && (
            <TabSection title={p.closed.replace('{n}', closedP.length)}>
              {closedP.map(row)}
            </TabSection>
          )}
        </div>
      )}

      {open && (
        <Modal title={he.projects.addTitle} onClose={() => setOpen(false)}>
          <ProjectForm onSubmit={submit} onCancel={() => setOpen(false)} />
        </Modal>
      )}
    </div>
  );
}
