import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { useAllProjects } from '../hooks/useAllProjects';
import { he } from '../locales/he';
import RefNumber from '../components/shared/RefNumber';
import PageHeader from '../components/ui/PageHeader';

const p = he.projects;
const NUM = { fontVariantNumeric: 'tabular-nums' };

export default function ProjectsPage() {
  const { member } = useOrg();
  const navigate = useNavigate();
  const { projects, loading } = useAllProjects(member.org_id);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = projects;

    if (statusFilter !== 'all') list = list.filter((x) => x.status === statusFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (x) =>
          x.name?.toLowerCase().includes(q) ||
          x.sku?.toLowerCase().includes(q) ||
          x.client?.name?.toLowerCase().includes(q) ||
          String(x.number).includes(q),
      );
    }

    return list;
  }, [projects, statusFilter, search]);

  return (
    <>
      <PageHeader title={p.title} subtitle={p.subtitle} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1">
          {[
            { key: 'all', label: he.tasks.filterAll },
            { key: 'open', label: p.status.open },
            { key: 'closed', label: p.status.closed },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`min-h-touch rounded-lg px-3 text-sm font-bold transition-colors ${
                statusFilter === f.key
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
          placeholder={he.shell.search}
          className="min-h-touch w-full rounded-xl border border-line bg-white px-4 text-sm text-navy placeholder:text-grayLight focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 sm:w-72"
        />
      </div>

      {loading ? (
        <p className="text-lg text-grayMid">{he.common.loading}</p>
      ) : filtered.length === 0 ? (
        <p className="py-12 text-center text-lg text-grayLight">
          {search || statusFilter !== 'all' ? he.shell.searchEmpty : p.emptyAll}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-right text-xs font-bold text-grayMid">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">{p.name}</th>
                <th className="hidden px-3 py-2 sm:table-cell">{he.tasks.client}</th>
                <th className="hidden px-3 py-2 md:table-cell">{p.sku}</th>
                <th className="hidden px-3 py-2 md:table-cell">{p.address}</th>
                <th className="px-3 py-2">{p.status.open}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proj) => (
                <tr
                  key={proj.id}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-surface"
                >
                  <td className="px-3 py-2" style={NUM}>
                    <RefNumber value={proj.number} />
                  </td>
                  <td className="max-w-[14rem] truncate px-3 py-2 font-bold text-navy">
                    {proj.name}
                  </td>
                  <td className="hidden max-w-[8rem] truncate px-3 py-2 text-grayDark sm:table-cell">
                    {proj.client?.name ?? he.common.none}
                  </td>
                  <td className="hidden px-3 py-2 text-grayMid md:table-cell">
                    {proj.sku || he.common.none}
                  </td>
                  <td className="hidden max-w-[10rem] truncate px-3 py-2 text-grayMid md:table-cell">
                    {proj.address || he.common.none}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${
                      proj.status === 'closed'
                        ? 'bg-appBg text-grayMid'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {proj.status === 'closed' ? p.status.closed : p.status.open}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
