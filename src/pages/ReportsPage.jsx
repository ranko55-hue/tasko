import { useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';
import AttendanceReport from '../components/reports/AttendanceReport';

const r = he.reports;

// מסך-אב לדוחות — רשימת דוחות זמינים. הוספת דוח = פריט במערך + ענף רינדור.
const REPORTS = [
  { key: 'attendance', label: r.attendance.title, hint: r.attendance.hint, icon: 'users' },
];

export default function ReportsPage() {
  const { member } = useOrg();
  const [open, setOpen] = useState(null);

  if (open === 'attendance') {
    return (
      <>
        <button type="button" onClick={() => setOpen(null)} className="text-base font-medium text-brand hover:underline">
          <Icon name="back" size="sm" className="inline-block" /> {r.title}
        </button>
        <div className="mt-2">
          <PageHeader title={r.attendance.title} subtitle={r.attendance.hint} />
          <AttendanceReport orgId={member.org_id} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={r.title} subtitle={r.subtitle} />
      <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
        {REPORTS.map((rep) => (
          <button
            key={rep.key}
            type="button"
            onClick={() => setOpen(rep.key)}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 text-start transition-colors hover:border-brand"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon name={rep.icon} size="md" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block font-black text-navy">{rep.label}</span>
              <span className="block text-sm text-grayMid">{rep.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
