import { useState } from 'react';
import { useOrg } from '../lib/orgContext';
import { isManager } from '../lib/roles';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { useMemberAttendance } from '../hooks/useAttendance';
import { monthlySummary, fmtHours, ymd } from '../lib/attendance';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import AttendanceReporter from '../components/attendance/AttendanceReporter';
import AttendanceDailyList from '../components/attendance/AttendanceDailyList';

const a = he.attendance;

// מסך "דיווח שעות" — לכל התפקידים. רכיב הדיווח + "הדיווחים שלי" לחודש.
export default function AttendancePage() {
  const { member } = useOrg();
  const manager = isManager(member);
  const { settings } = useOrgSettings(member.org_id);
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const from = ymd(monthDate);
  const to = ymd(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
  const { entries, loading, refetch } = useMemberAttendance(member.org_id, member.id, from, to);
  const sum = monthlySummary(entries);

  const monthValue = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
  function onMonth(e) {
    const [y, m] = e.target.value.split('-').map(Number);
    if (y && m) setMonthDate(new Date(y, m - 1, 1));
  }

  return (
    <>
      <PageHeader title={a.pageTitle} subtitle={a.pageSubtitle} />

      <div className="max-w-2xl space-y-6">
        <AttendanceReporter
          orgId={member.org_id}
          targetMemberId={member.id}
          reportedBy={member.id}
          settings={settings}
          pastLimitDays={manager ? null : 7}
          onSaved={refetch}
        />

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-grayMid">{a.myReports}</h2>
            <input
              type="month"
              value={monthValue}
              onChange={onMonth}
              className="min-h-touch rounded-xl border border-line bg-white px-3 text-sm text-navy focus:border-brand focus:outline-none"
            />
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2">
            <Summary label={a.types.work} value={`${fmtHours(sum.workHours)} ${a.hoursUnit}`} color="text-green-700" />
            <Summary label={a.types.vacation} value={`${sum.vacationDays} ${a.daysUnit}`} color="text-blue-700" />
            <Summary label={a.types.sick} value={`${sum.sickDays} ${a.daysUnit}`} color="text-yellow-700" />
          </div>

          {loading ? (
            <p className="py-6 text-center text-grayMid">{he.common.loading}</p>
          ) : (
            <AttendanceDailyList entries={entries} canViewNotes empty={a.noEntries} />
          )}
        </div>
      </div>
    </>
  );
}

function Summary({ label, value, color }) {
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-3 text-center">
      <div className={`text-lg font-black ${color}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="mt-1 text-xs font-bold text-grayMid">{label}</div>
    </div>
  );
}
