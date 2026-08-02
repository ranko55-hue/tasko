import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useTeamList } from '../hooks/useTeamList';
import { he } from '../locales/he';
import Button from '../components/shared/Button';
import Modal from '../components/shared/Modal';
import PageHeader from '../components/ui/PageHeader';
import TeamTable from '../components/team/TeamTable';
import MemberForm from '../components/team/MemberForm';
import CredentialsModal from '../components/team/CredentialsModal';

const t = he.team;

export default function TeamPage() {
  const { member } = useOrg();
  const navigate = useNavigate();
  const { members, loading, error, refetch } = useTeamList(member.org_id);

  const [addOpen, setAddOpen] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = members;

    if (filter === 'active') list = list.filter((m) => m.is_active);
    else if (filter === 'inactive') list = list.filter((m) => !m.is_active);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.phone?.includes(q),
      );
    }

    return list;
  }, [members, filter, search]);

  function handleCreated(creds) {
    setAddOpen(false);
    setCredentials(creds);
    refetch();
  }

  const FILTERS = [
    { key: 'all', label: t.filterAll },
    { key: 'active', label: t.filterActive },
    { key: 'inactive', label: t.filterInactive },
  ];

  return (
    <>
      <PageHeader
        title={t.title}
        subtitle={t.memberCount.replace('{n}', members.length)}
        actions={
          <div className="w-40">
            <Button onClick={() => setAddOpen(true)}>{t.add}</Button>
          </div>
        }
      />

      {/* סינון + חיפוש */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`min-h-touch rounded-lg px-3 text-sm font-bold transition-colors ${
                filter === f.key
                  ? 'bg-navy text-white'
                  : 'text-grayDark hover:bg-appBg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="min-h-touch w-full rounded-xl border border-line bg-white px-4 text-sm text-navy placeholder:text-grayLight focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 sm:w-72"
        />
      </div>

      {loading ? (
        <p className="text-lg text-grayMid">{he.common.loading}</p>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="mb-4 text-lg text-grayDark">{t.loadError}</p>
          <div className="mx-auto w-40">
            <Button onClick={refetch}>{he.common.retry}</Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-lg text-grayLight">
          {search ? he.shell.searchEmpty : t.empty}
        </p>
      ) : (
        <TeamTable rows={filtered} allMembers={members} onOpen={(m) => navigate(`/team/${m.id}`)} />
      )}

      {addOpen && (
        <Modal title={t.addTitle} onClose={() => setAddOpen(false)}>
          <MemberForm onCreated={handleCreated} onCancel={() => setAddOpen(false)} />
        </Modal>
      )}

      {credentials && (
        <Modal title={he.team.credentials.title} onClose={() => setCredentials(null)}>
          <CredentialsModal
            email={credentials.email}
            password={credentials.password}
            onClose={() => setCredentials(null)}
          />
        </Modal>
      )}
    </>
  );
}
