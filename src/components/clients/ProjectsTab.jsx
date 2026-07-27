import { useState } from 'react';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ProjectForm from '../projects/ProjectForm';
import Row from '../ui/Row';
import StatusPill from '../ui/StatusPill';
import EmptyState from '../ui/EmptyState';
import TabSection from './TabSection';

// לשונית פרויקטים — פתוחים / סגורים, אותה Row משותפת. תג "פעיל · N משימות".
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
    <Row
      key={x.id}
      icon="🗂️"
      title={x.name}
      subtitle={x.address}
      trailing={
        x.status === 'open' ? (
          <StatusPill
            tone="green"
            label={p.activeTag.replace('{n}', openTaskCountByProject[x.id] || 0)}
          />
        ) : (
          <StatusPill tone="done" label={he.projects.status.closed} />
        )
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
        <EmptyState emoji="🗂️" message={p.empty} />
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
