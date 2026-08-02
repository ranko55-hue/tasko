import { useEffect, useState } from 'react';
import { he } from '../../../locales/he';
import { useTaskTimeline } from '../../../hooks/useTaskTimeline';
import { useCustomFields } from '../../../hooks/useCustomFields';
import { useCustomFieldValues } from '../../../hooks/useCustomFieldValues';
import Modal from '../../shared/Modal';
import TaskChips from './TaskChips';
import TimeBox from './TimeBox';
import AssigneeCard from './AssigneeCard';
import SectionHeader from './SectionHeader';
import MediaStrip from './MediaStrip';
import TimelineList from './TimelineList';

const d = he.tasks.drawer;
const cf = he.customFields;
const PREVIEW = 4;

export default function DrawerViewBody({ task, assigneeName, refreshKey, onEvents }) {
  const { events } = useTaskTimeline(task?.id, refreshKey);
  const { fields } = useCustomFields(task?.org_id, 'task');
  const { values } = useCustomFieldValues(task?.org_id, 'task', task?.id);
  const [allTimeline, setAllTimeline] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  // מדווח את האירועים למעלה לצורך סיכום ה-PDF
  useEffect(() => { onEvents?.(events); }, [events, onEvents]);

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

      {fields.length > 0 && (
        <>
          <SectionHeader label={d.sectionCustomFields} count={fields.filter((f) => values[f.id]).length} />
          <div className="mx-4 mb-4 space-y-2 sm:mx-5">
            {fields.map((f) => (
              <div key={f.id} className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 text-sm text-slate-500">{f.label}</span>
                <span className="min-w-0 truncate text-sm font-medium text-slate-900">
                  {values[f.id] ?? cf.noValue}
                </span>
              </div>
            ))}
          </div>
        </>
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
