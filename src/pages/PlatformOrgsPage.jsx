import { useState, useMemo } from 'react';
import { he } from '../locales/he';
import { usePlatformOrgs, usePlatformBilling } from '../hooks/usePlatformOrgs';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import OrgRow from '../components/platform/OrgRow';
import PlatformBillingStrip from '../components/platform/PlatformBillingStrip';

const t = he.platform.orgs;

export default function PlatformOrgsPage() {
  const { orgs, loading, error, refetch } = usePlatformOrgs();
  const { map: billingMap, extend } = usePlatformBilling();
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
        <p className="text-grayMid">{he.common.loading}</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title={t.title} subtitle={t.subtitle} />
        <p className="rounded-lg bg-urgentSoft px-4 py-3 text-sm font-medium text-urgentInk">
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
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm placeholder:text-grayLight focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand md:max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-grayLight">{t.empty}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((org) => (
            <div key={org.id}>
              <OrgRow org={org} onMemberChanged={refetch} />
              <PlatformBillingStrip billing={billingMap[org.id]} onExtend={(days) => extend(org.id, days)} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function KpiCard({ label, value }) {
  return (
    <Card className="p-4 text-center">
      <div className="text-2xl font-black text-navy tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-bold text-grayLight">{label}</div>
    </Card>
  );
}
