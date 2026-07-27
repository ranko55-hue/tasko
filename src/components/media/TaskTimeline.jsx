import { useState } from 'react';
import { he } from '../../locales/he';
import { formatDateTime } from '../../lib/time';
import { useTaskTimeline } from '../../hooks/useTaskTimeline';
import Modal from '../shared/Modal';

const t = he.media;

// שורת אירוע בציר הזמן
function Row({ ev, onPhoto }) {
  const label = t.eventTypes[ev.type] ?? ev.type;
  const text =
    ['text_note', 'manager_attachment', 'blocked'].includes(ev.type) &&
    ev.payload?.text;

  return (
    <li className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-bold text-slate-600">{label}</span>
        <span>{formatDateTime(ev.created_at)}</span>
      </div>

      {text && <p className="mt-1 whitespace-pre-wrap text-slate-800">{text}</p>}

      {ev.type === 'photo' && ev.url && (
        <button type="button" onClick={() => onPhoto(ev.url)} className="mt-2 block">
          <img
            src={ev.url}
            alt={t.photoAlt}
            className="h-24 w-24 rounded-lg object-cover"
          />
        </button>
      )}

      {ev.type === 'voice_note' && ev.url && (
        <audio controls src={ev.url} className="mt-2 w-full" />
      )}
    </li>
  );
}

// ציר זמן משותף — עובד ומנהל. inline (לא מודאל) כדי שלייטבוקס התמונה לא ייפתח מודאל-על-מודאל.
export default function TaskTimeline({ taskId }) {
  const { events, loading, error } = useTaskTimeline(taskId);
  const [lightbox, setLightbox] = useState(null);

  if (loading)
    return <p className="py-4 text-center text-slate-500">{he.common.loading}</p>;
  if (error)
    return <p className="py-4 text-center text-red-600">{t.errors.timeline}</p>;
  if (!events.length)
    return <p className="py-4 text-center text-slate-400">{t.timelineEmpty}</p>;

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
