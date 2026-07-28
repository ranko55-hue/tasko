import { he } from '../../locales/he';
import { formatDateTime } from '../../lib/time';

const t = he.tasks;

function Row({ label, children }) {
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-medium text-slate-900">{children}</div>
    </div>
  );
}

// תצוגת פרטי המשימה (קריאה בלבד). הלקוח תמיד מוצג, הפרויקט רק אם קיים (v8 §3.4).
export default function TaskDetailsView({ task, assigneeName }) {
  return (
    <div className="space-y-4">
      <Row label={t.client}>{task.client?.name ?? he.common.none}</Row>

      {task.project && <Row label={t.project}>{task.project.name}</Row>}

      {task.description && <Row label={t.description}>{task.description}</Row>}
      {task.address && <Row label={t.address}>{task.address}</Row>}

      <Row label={t.assignee}>{assigneeName}</Row>

      {task.due_at && <Row label={t.dueAt}>{formatDateTime(task.due_at)}</Row>}
      {task.est_minutes && <Row label={t.estMinutes}>{task.est_minutes}</Row>}

      {task.requirements?.length > 0 && (
        <div>
          <div className="text-sm text-slate-500">{t.requirements}</div>
          <div className="mt-1 space-y-1">
            {task.requirements.map((req, i) => (
              <div key={i} className="rounded bg-slate-50 p-2 text-sm text-slate-700">
                {req}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
