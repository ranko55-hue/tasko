// תרגום אירוע 'edited' לשורות עברית לציר הזמן (אפיון v8 §3.4).
// ה-payload נכתב בטריגר tasks_guard_manager_edit ומגיע בצורה:
//   { "changes": [ { "field": "due_at", "from": "…", "to": "…" }, … ] }
// שדות מפתח זר כבר מגיעים כשם קריא ולא כ-UUID.
import { he } from '../locales/he';
import { formatDateTime } from './time';

const m = he.media;
const DATE_FIELDS = ['due_at', 'scheduled_start_at'];

// ערך גולמי → מחרוזת תצוגה לפי סוג השדה
function formatValue(field, value) {
  if (value === null || value === undefined || value === '') return null;

  if (DATE_FIELDS.includes(field)) return formatDateTime(value);
  if (field === 'priority') return he.tasks.priorityOpt[value] ?? value;
  if (field === 'requirements') {
    const list = Array.isArray(value) ? value : [];
    return list.length ? list.join(', ') : null;
  }
  return String(value);
}

// שינוי בודד → משפט אחד בעברית
export function describeChange(change) {
  if (!change?.field) return null;

  const label = m.editedFields[change.field] ?? change.field;
  const from = formatValue(change.field, change.from);
  const to = formatValue(change.field, change.to);

  if (from && to) return m.editedChanged(label, from, to);
  if (!from && to) return m.editedSet(label, to);
  if (from && !to) return m.editedCleared(label);
  return null;
}

// payload של אירוע → מערך משפטים
export function describeEdit(payload) {
  const changes = Array.isArray(payload?.changes) ? payload.changes : [];
  return changes.map(describeChange).filter(Boolean);
}
