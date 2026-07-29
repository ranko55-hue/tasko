import { useState } from 'react';
import { he } from '../../../locales/he';
import { useTaskTimeline } from '../../../hooks/useTaskTimeline';
import Modal from '../../shared/Modal';
import TaskChips from './TaskChips';
import TimeBox from './TimeBox';
import AssigneeCard from './AssigneeCard';
import SectionHeader from './SectionHeader';
import MediaStrip from './MediaStrip';
import TimelineList from './TimelineList';

const d = he.tasks.drawer;
const PREVIEW = 4; // כמה עדכונים מוצגים לפני "הצג הכל"

// גוף המגירה במצב צפייה — צ'יפים, זמן, עובד, מדיה וציר זמן.
export default function DrawerViewBody({ task, assigneeName, refreshKey }) {
  const { events } = useTaskTimeline(task?.id, refreshKey);
  const [allTimeline, setAllTimeline] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const photos = events.filter((e) => e.type === 'photo' && e.url);
  const voices = events.filter((e) => e.type === 'voice_note' && e.url);
  const mediaCount = photos.length + voices.length;

  const ordered = [...events].reverse(); // החדש למעלה
  const shown = allTimeline ? ordered : ordered.slice(0, PREVIEW);

  return (
    <>
      <TaskChips task={task} />
      <TimeBox task={task} />
      <AssigneeCard task={task} assigneeName={assigneeName} />

      {task?.description && (
        <p className="mx-4 mb-4 whitespace-pre-wrap text-slate-700 sm:mx-5">
          {task.description}
        </p>
      )}

      <SectionHeader label={d.sectionMedia} count={mediaCount} />
      <MediaStrip photos={photos} voices={voices} onPhoto={setLightbox} />

      <SectionHeader
        label={d.sectionTimeline}
        count={events.length}
        onShowAll={
          ordered.length > PREVIEW && !allTimeline ? () => setAllTimeline(true) : undefined
        }
      />
      <TimelineList events={shown} onPhoto={setLightbox} />

      {lightbox && (
        <Modal title={he.media.photoAlt} onClose={() => setLightbox(null)}>
          <img
            src={lightbox}
            alt={he.media.photoAlt}
            className="mx-auto max-h-[70vh] rounded-lg"
          />
        </Modal>
      )}
    </>
  );
}
