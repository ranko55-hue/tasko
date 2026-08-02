import { useState } from 'react';
import { he } from '../../locales/he';
import { usePlatformOrgMembers, useToggleMember } from '../../hooks/usePlatformOrgs';
import Button from '../shared/Button';
import Card from '../ui/Card';

const t = he.platform.orgs;

const ROLE_LABEL = { admin: t.roleAdmin, manager: t.roleManager, worker: t.roleWorker };

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

function relativeDate(iso) {
  if (!iso) return t.never;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'היום';
  if (days === 1) return 'אתמול';
  if (days < 30) return `${days} ימים`;
  return fmtDate(iso);
}

export default function OrgRow({ org, onMemberChanged }) {
  const [open, setOpen] = useState(false);
  const { members, loading, fetchMembers } = usePlatformOrgMembers();
  const { toggle, busy } = useToggleMember();

  async function handleExpand() {
    if (open) {
      setOpen(false);
      return;
    }
    await fetchMembers(org.id);
    setOpen(true);
  }

  async function handleToggle(memberId, newActive) {
    const { error } = await toggle(memberId, newActive);
    if (!error) {
      await fetchMembers(org.id);
      onMemberChanged();
    }
  }

  return (
    <Card>
      {/* Header */}
      <button
        type="button"
        onClick={handleExpand}
        className="flex w-full items-center gap-4 px-4 py-4 text-right"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900">{org.name}</h3>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>{t.members}: {org.member_count}</span>
            {org.inactive_count > 0 && (
              <span className="text-amber-600">({org.inactive_count} {t.inactive})</span>
            )}
            <span>{t.tasks}: {org.task_count}</span>
            <span>{t.clients}: {org.client_count}</span>
            <span>{t.projects}: {org.project_count}</span>
            <span>{t.created}: {fmtDate(org.created_at)}</span>
          </div>
        </div>
        <span className="shrink-0 text-sm font-bold text-brand">
          {open ? t.hideMembers : t.showMembers}
        </span>
      </button>

      {/* Members */}
      {open && (
        <div className="border-t border-line">
          {loading ? (
            <p className="px-4 py-4 text-sm text-slate-400">{he.common.loading}</p>
          ) : members.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">{t.noMembers}</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <MemberTable members={members} onToggle={handleToggle} busy={busy} />
              </div>
              {/* Mobile cards */}
              <div className="flex flex-col gap-2 p-3 md:hidden">
                {members.map((m) => (
                  <MemberCard key={m.id} member={m} onToggle={handleToggle} busy={busy} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function MemberTable({ members, onToggle, busy }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line bg-slate-50 text-right text-xs font-bold text-slate-500">
          <th className="px-4 py-2">{t.memberName}</th>
          <th className="px-4 py-2">{t.memberRole}</th>
          <th className="px-4 py-2">{t.memberPhone}</th>
          <th className="px-4 py-2">{t.memberEmail}</th>
          <th className="px-4 py-2">{t.memberStatus}</th>
          <th className="px-4 py-2">{t.memberLastSeen}</th>
          <th className="px-4 py-2" />
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr
            key={m.id}
            className={`border-b border-line last:border-0 ${!m.is_active ? 'opacity-50' : ''}`}
          >
            <td className="px-4 py-2 font-medium">{m.full_name}</td>
            <td className="px-4 py-2">
              <RoleBadge role={m.role} />
            </td>
            <td className="px-4 py-2 tabular-nums">{m.phone || '—'}</td>
            <td className="px-4 py-2 text-slate-500">{m.email || '—'}</td>
            <td className="px-4 py-2">
              <StatusBadge active={m.is_active} />
            </td>
            <td className="px-4 py-2 text-slate-400">{relativeDate(m.last_sign_in_at)}</td>
            <td className="px-4 py-2">
              <Button
                size="sm"
                variant={m.is_active ? 'ghost' : 'primary'}
                disabled={busy}
                onClick={() => onToggle(m.id, !m.is_active)}
              >
                {m.is_active ? t.deactivate : t.activate}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MemberCard({ member: m, onToggle, busy }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-3 ${!m.is_active ? 'opacity-50' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-bold text-slate-900">{m.full_name}</span>
        <StatusBadge active={m.is_active} />
      </div>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
        <RoleBadge role={m.role} />
        {m.phone && <span className="tabular-nums">{m.phone}</span>}
        {m.email && <span>{m.email}</span>}
        <span>{relativeDate(m.last_sign_in_at)}</span>
      </div>
      <Button
        size="sm"
        variant={m.is_active ? 'ghost' : 'primary'}
        disabled={busy}
        onClick={() => onToggle(m.id, !m.is_active)}
        className="w-full"
      >
        {m.is_active ? t.deactivate : t.activate}
      </Button>
    </div>
  );
}

function RoleBadge({ role }) {
  const colors = {
    admin: 'bg-indigo-50 text-indigo-700',
    manager: 'bg-sky-50 text-sky-700',
    worker: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${colors[role] || colors.worker}`}>
      {ROLE_LABEL[role] || role}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
        active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {active ? t.statusActive : t.statusInactive}
    </span>
  );
}
