import { he } from '../../locales/he';

const t = he.team.detail;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export default function MemberHeaderCard({ member, stats, managerName }) {
  const active = member.is_active;
  const letter = (member.full_name || '?')[0];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-black ${
            active ? 'bg-navy text-brandYellow' : 'bg-lineDark text-white'
          }`}
        >
          {letter}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-black text-navy">{member.full_name}</h2>
            <span
              className={`inline-block h-3 w-3 rounded-full ${active ? 'bg-statusGreen' : 'bg-lineDark'}`}
            />
          </div>
          <p className="text-sm text-grayMid">
            {he.roles[member.role] ?? member.role}
            {managerName ? ` · ${managerName}` : ''}
          </p>
        </div>
      </div>

      {stats && (
        <p className="mt-3 text-sm text-grayMid" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {t.taskCount.replace('{n}', stats.total)}
          {' · '}
          {t.onTime.replace('{pct}', stats.onTimePct)}
          {' · '}
          {t.since.replace('{date}', fmtDate(member.created_at))}
        </p>
      )}
    </div>
  );
}
