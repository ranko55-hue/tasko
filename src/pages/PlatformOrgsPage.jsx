import { useState, useMemo } from 'react';
import { he } from '../locales/he';
import { usePlatformOrgs } from '../hooks/usePlatformOrgs';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import OrgRow from '../components/platform/OrgRow';

const t = he.platform.orgs;

export default function PlatformOrgsPage() {
  const { orgs, loading, error, refetch } = usePlatformOrgs();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return orgs;
    const q = search.trim().toLowerCase();
    return orgs.filter((o) => o.name.toLowerCase().includes(q));
  }, [orgs, search]);

  const totalMembers = orgs.reduce((s, o) => s + (o.member_count || 0), 0);
  const totalTasks = orgs.reduce((s, o) => s + (o.task_count || 0), 0);

  if (loading) {
    return (
      <>
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <p className="text-slate-500">{he.common.loading}</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {t.loadError}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {/* KPI */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <KpiCard label={t.kpiOrgs} value={orgs.length} />
        <KpiCard label={t.kpiMembers} value={totalMembers} />
        <KpiCard label={t.kpiTasks} value={totalTasks} />
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand md:max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-slate-400">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((org) => (
            <OrgRow key={org.id} org={org} onMemberChanged={refetch} />
          ))}
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl font-black text-slate-900 tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-bold text-slate-400">{label}</div>
    </Card>
  );
}
