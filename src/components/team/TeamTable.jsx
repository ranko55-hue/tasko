import { he } from '../../locales/he';

const t = he.team;
const NUM = { fontVariantNumeric: 'tabular-nums' };

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

function Avatar({ name, active }) {
  const letter = (name || '?')[0];
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
        active ? 'bg-navy text-brandYellow' : 'bg-slate-300 text-white'
      }`}
    >
      {letter}
    </div>
  );
}

function StatusDot({ active }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${active ? 'bg-statusGreen' : 'bg-slate-300'}`} />
  );
}

function DesktopTable({ rows, managers, onOpen }) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-start text-xs font-bold text-slate-500">
            <th className="px-4 py-3">{t.table.name}</th>
            <th className="px-4 py-3">{t.table.role}</th>
            <th className="px-4 py-3">{t.table.manager}</th>
            <th className="px-4 py-3">{t.table.phone}</th>
            <th className="px-4 py-3" style={NUM}>{t.table.joined}</th>
            <th className="px-4 py-3">{t.table.status}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const mgr = managers.get(m.manager_id);
            return (
              <tr
                key={m.id}
                onClick={() => onOpen(m)}
                className="cursor-pointer border-b border-line last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.full_name} active={m.is_active} />
                    <span className="font-bold text-slate-900">{m.full_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{he.roles[m.role] ?? m.role}</td>
                <td className="px-4 py-3 text-slate-500">{mgr?.full_name ?? t.noManager}</td>
                <td className="px-4 py-3 text-slate-500" dir="ltr">{m.phone || '—'}</td>
                <td className="px-4 py-3 text-slate-500" style={NUM}>{fmtDate(m.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusDot active={m.is_active} />
                    <span className={m.is_active ? 'text-slate-700' : 'text-slate-400'}>
                      {m.is_active ? t.active : t.inactive}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MobileCards({ rows, managers, onOpen }) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((m) => {
        const mgr = managers.get(m.manager_id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(m)}
            className="flex min-h-touch w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-start shadow-sm"
          >
            <Avatar name={m.full_name} active={m.is_active} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold text-slate-900">{m.full_name}</span>
                <StatusDot active={m.is_active} />
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                {he.roles[m.role] ?? m.role}
                {mgr ? ` · ${mgr.full_name}` : ''}
              </div>
            </div>
            <span className="text-xs text-slate-400" style={NUM}>{fmtDate(m.created_at)}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function TeamTable({ rows, allMembers, onOpen }) {
  const managers = new Map(allMembers.map((m) => [m.id, m]));
  return (
    <>
      <DesktopTable rows={rows} managers={managers} onOpen={onOpen} />
      <MobileCards rows={rows} managers={managers} onOpen={onOpen} />
    </>
  );
}
