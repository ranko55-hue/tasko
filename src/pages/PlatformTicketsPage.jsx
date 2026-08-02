import { useState } from 'react';
import { he } from '../locales/he';
import { usePlatformTickets } from '../hooks/useSupportTickets';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/shared/Button';
import Card from '../components/ui/Card';

const t = he.platform.tickets;

const FILTERS = [
  { key: 'all', label: t.filterAll },
  { key: 'open', label: t.filterOpen },
  { key: 'done', label: t.filterDone },
];

const CHIP = 'min-h-touch rounded-full px-4 text-sm font-bold transition-colors';
const CHIP_ON = CHIP + ' bg-brand/10 text-brand';
const CHIP_OFF = CHIP + ' bg-appBg text-grayDark hover:bg-line';

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export default function PlatformTicketsPage() {
  const { tickets, loading, error, setStatus } = usePlatformTickets();
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? tickets : tickets.filter((tk) => tk.status === filter);
  const openCount = tickets.filter((tk) => tk.status === 'open').length;

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
      <PageHeader
        title={t.title}
        subtitle={openCount > 0 ? t.openCount.replace('{n}', openCount) : t.subtitle}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={filter === key ? CHIP_ON : CHIP_OFF}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-grayLight">{t.empty}</p>
      ) : (
        <>
          {/* דסקטופ — טבלה */}
          <div className="hidden md:block">
            <TicketTable tickets={filtered} onSetStatus={setStatus} />
          </div>
          {/* מובייל — כרטיסים */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((tk) => (
              <TicketCard key={tk.id} ticket={tk} onSetStatus={setStatus} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function TicketTable({ tickets, onSetStatus }) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-right text-xs font-bold text-grayMid">
            <th className="px-4 py-3">{t.org}</th>
            <th className="px-4 py-3">{t.author}</th>
            <th className="px-4 py-3">{t.subject}</th>
            <th className="px-4 py-3">{t.date}</th>
            <th className="px-4 py-3">{t.status}</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {tickets.map((tk) => (
            <tr
              key={tk.id}
              className={`border-b border-line last:border-0 ${tk.status === 'done' ? 'opacity-60' : ''}`}
            >
              <td className="px-4 py-3 font-medium">{tk.org_name}</td>
              <td className="px-4 py-3">
                <div>{tk.author_name}</div>
                {tk.author_email && (
                  <div className="text-xs text-grayLight">{tk.author_email}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="font-bold">{tk.subject}</div>
                <div className="mt-1 whitespace-pre-wrap text-xs text-grayMid">
                  {tk.message}
                </div>
              </td>
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                <div>{fmtDate(tk.created_at)}</div>
                <div className="text-xs text-grayLight">{fmtTime(tk.created_at)}</div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={tk.status} />
              </td>
              <td className="px-4 py-3">
                <ToggleButton ticket={tk} onSetStatus={onSetStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function TicketCard({ ticket: tk, onSetStatus }) {
  return (
    <Card className={`p-4 ${tk.status === 'done' ? 'opacity-60' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-grayLight">{tk.org_name}</span>
        <StatusBadge status={tk.status} />
      </div>
      <h3 className="mb-1 text-base font-bold text-navy">{tk.subject}</h3>
      <p className="mb-3 whitespace-pre-wrap text-sm text-grayDark">{tk.message}</p>
      <div className="mb-3 flex items-center gap-3 text-xs text-grayLight">
        <span>{tk.author_name}</span>
        <span className="tabular-nums">{fmtDate(tk.created_at)} {fmtTime(tk.created_at)}</span>
      </div>
      <ToggleButton ticket={tk} onSetStatus={onSetStatus} />
    </Card>
  );
}

function StatusBadge({ status }) {
  const isOpen = status === 'open';
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        isOpen ? 'bg-urgentSoft text-urgentInk' : 'bg-green-50 text-green-700'
      }`}
    >
      {isOpen ? t.statusOpen : t.statusDone}
    </span>
  );
}

function ToggleButton({ ticket: tk, onSetStatus }) {
  if (tk.status === 'open') {
    return (
      <Button size="sm" onClick={() => onSetStatus(tk.id, 'done')}>
        {t.markDone}
      </Button>
    );
  }
  return (
    <Button size="sm" variant="ghost" onClick={() => onSetStatus(tk.id, 'open')}>
      {t.reopen}
    </Button>
  );
}
