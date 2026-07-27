import { he } from '../../locales/he';
import Button from '../shared/Button';

const w = he.worker;

// חוקת הכפתורים: פעולה ראשית אחת ענקית לכל מצב + משניות ברוחב מלא (≥48px).
export default function TaskActionBar({ task, locked, actions }) {
  // משימה נעולה / הושלמה / בוטלה — אין פעולות ביצוע
  if (locked || task.status === 'done' || task.status === 'cancelled') {
    return null;
  }

  const { onStart, onPause, onResume, onFinish, onUnblock, onNote, onDelay } =
    actions;

  return (
    <div className="space-y-3">
      {(task.status === 'pending' || task.status === 'scheduled') && (
        <Button size="lg" onClick={onStart}>
          {w.start}
        </Button>
      )}

      {task.status === 'in_progress' && (
        <>
          <Button size="lg" onClick={onFinish}>
            {w.finish}
          </Button>
          <Button variant="outline" onClick={onPause}>
            {w.pause}
          </Button>
        </>
      )}

      {task.status === 'paused' && (
        <>
          <Button size="lg" onClick={onResume}>
            {w.resume}
          </Button>
          <Button variant="outline" onClick={onFinish}>
            {w.finish}
          </Button>
        </>
      )}

      {task.status === 'blocked' && (
        <Button size="lg" onClick={onUnblock}>
          {w.unblock}
        </Button>
      )}

      {/* פעולות משניות זמינות תמיד (מלבד חסום → בלי דיווח עיכוב נוסף) */}
      <Button variant="outline" onClick={onNote}>
        {w.note}
      </Button>
      {task.status !== 'blocked' && (
        <Button variant="danger" onClick={onDelay}>
          {w.reportDelay}
        </Button>
      )}
    </div>
  );
}
