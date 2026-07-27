import { useNavigate } from 'react-router-dom';
import { he } from '../../locales/he';
import Row from '../ui/Row';
import EmptyState from '../ui/EmptyState';

// רשימת לקוחות — Row משותפת, לחיצה נכנסת לכרטיס הלקוח.
export default function ClientList({ clients }) {
  const navigate = useNavigate();

  if (clients.length === 0) {
    return <EmptyState emoji="👥" message={he.clients.empty} />;
  }

  return (
    <div className="space-y-3">
      {clients.map((c) => (
        <Row
          key={c.id}
          icon="🏢"
          title={c.name}
          subtitle={
            [c.contact_name, c.contact_phone].filter(Boolean).join(' · ') ||
            he.common.none
          }
          onClick={() => navigate(`/clients/${c.id}`)}
        />
      ))}
    </div>
  );
}
