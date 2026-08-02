import { useState } from 'react';
import { he } from '../../locales/he';
import { formatDateTime } from '../../lib/time';
import { useTaskTimeline } from '../../hooks/useTaskTimeline';
import { describeEdit } from '../../lib/taskEdits';
import Modal from '../shared/Modal';
import EventMedia from './EventMedia';

const t = he.media;

// שורת אירוע בציר הזמן
function Row({ ev, onPhoto }) {
  const label = t.eventTypes[ev.type] ?? ev.type;
  const text =
    ['text_note', 'manager_attachment', 'blocked', 'cancelled'].includes(ev.type) &&
    ev.payload?.text;
  // אירוע עריכה → שורה בעברית לכל שדה שהשתנה (v8 §3.4)
  const edits = ev.type === 'edited' ? describeEdit(ev.payload) : [];

  return (
    <li className="rounded-xl bg-surface p-3">
      <div className="flex items-center justify-between text-xs text-grayLight">
        <span className="font-bold text-grayDark">{label}</span>
        <span>{formatDateTime(ev.created_at)}</span>
      </div>

      {text && <p className="mt-1 whitespace-pre-wrap text-navy2">{text}</p>}

      {edits.length > 0 && (
        <ul className="mt-1 space-y-1">
          {edits.map((line, i) => (
            <li key={i} className="text-navy2">
              {line}
            </li>
          ))}
        </ul>
      )}

      <EventMedia event={ev} onPhoto={onPhoto} />
    </li>
  );
}

// ציר זמן משותף — עובד ומנהל. inline (לא מודאל) כדי שלייטבוקס התמונה לא ייפתח מודאל-על-מודאל.
export default function TaskTimeline({ taskId }) {
  const { events, loading, error } = useTaskTimeline(taskId);
  const [lightbox, setLightbox] = useState(null);

  if (loading)
    return <p className="py-4 text-center text-grayMid">{he.common.loading}</p>;
  if (error)
    return <p className="py-4 text-center text-danger">{t.errors.timeline}</p>;
  if (!events.length)
    return <p className="py-4 text-center text-grayLight">{t.timelineEmpty}</p>;

  return (
    <>
      <ul className="space-y-2">
        {events.map((ev) => (
          <Row key={ev.id} ev={ev} onPhoto={setLightbox} />
        ))}
      </ul>

      {lightbox && (
        <Modal title={t.photoAlt} onClose={() => setLightbox(null)}>
          <img src={lightbox} alt={t.photoAlt} className="mx-auto max-h-[70vh] rounded-lg" />
        </Modal>
      )}
    </>
  );
}
