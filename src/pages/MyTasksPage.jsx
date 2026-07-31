import { useOrg } from '../lib/orgContext';
import { useMyTasks } from '../hooks/useMyTasks';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import MyTaskList from '../components/worker/MyTaskList';
import MyTasksDesktop from '../components/worker/desktop/MyTasksDesktop';

// מסך העובד — "המשימות שלי" (עובד / ראש צוות; מנהל יכול לצפות גם)
//
// שני מצבים, לא שני מסכים:
// • מובייל (< md) — תצוגת איש השטח כפי שהייתה, כפתורים ענקיים, בלי מתג
//   ובלי תלות בהעדפת התצוגה. איש השטח לא בוחר תצוגות.
// • דסקטופ (md+) — שתי תצוגות במתג (שורות / כרטיסים), נשמר ב-localStorage
//   וניתן לשינוי גם ממסך ההגדרות.
export default function MyTasksPage() {
  const { member } = useOrg();
  const { tasks, loading, applyLocal } = useMyTasks(member.id);

  if (loading) {
    return (
      <>
        <PageHeader title={he.worker.title} />
        <p className="text-lg text-slate-500">{he.common.loading}</p>
      </>
    );
  }

  return (
    <>
      {/* מובייל — ללא שינוי מהמצב הקיים */}
      <div className="md:hidden">
        <PageHeader title={he.worker.title} />
        <MyTaskList tasks={tasks} onUpdated={applyLocal} />
      </div>

      {/* דסקטופ — הכותרת נכללת ברכיב עצמו, לצד המתג */}
      <div className="hidden md:block">
        <MyTasksDesktop tasks={tasks} onUpdated={applyLocal} />
      </div>
    </>
  );
}
