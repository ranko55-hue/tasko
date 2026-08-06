import { monthRange } from '../../lib/attendance';
import { useMemberAttendance } from '../../hooks/useAttendance';
import { he } from '../../locales/he';
import AttendanceDailyList from '../attendance/AttendanceDailyList';

// לשונית "נוכחות" בכרטיס העובד — פירוט יומי לחודש הנוכחי (מנהל רואה אישורים).
export default function MemberAttendanceTab({ memberId, orgId }) {
  const { from, to } = monthRange();
  const { entries, loading } = useMemberAttendance(orgId, memberId, from, to);

  if (loading) return <p className="py-6 text-center text-grayMid">{he.common.loading}</p>;

  return (
    <div>
      <p className="mb-3 text-[11px] font-bold tracking-wide text-grayMid">{he.attendance.thisMonth}</p>
      <AttendanceDailyList entries={entries} canViewNotes />
    </div>
  );
}
