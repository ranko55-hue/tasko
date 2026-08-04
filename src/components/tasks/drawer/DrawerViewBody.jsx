import { useEffect, useState } from 'react';
import { he } from '../../../locales/he';
import { useTaskTimeline } from '../../../hooks/useTaskTimeline';
import { useCustomFields } from '../../../hooks/useCustomFields';
import { useCustomFieldValues } from '../../../hooks/useCustomFieldValues';
import { dateRangeLabel, dueTimeLabel } from '../../../lib/taskDates';
import { isLate } from '../../../lib/lateness';
import { allocatedMinutes, usedMinutes, overrunMinutes, isOverTime, usagePercent } from '../../../lib/taskTime';
import Modal from '../../shared/Modal';
import Icon from '../../ui/Icon';
import AssigneeCard from './AssigneeCard';
import MediaStrip from './MediaStrip';
import TimelineList from './TimelineList';
import InfoStrip from './InfoStrip';
import CollapsibleSection from './CollapsibleSection';
import ExecutionTools from './ExecutionTools';
import StopFinishBlock from './StopFinishBlock';

const d = he.tasks.drawer;
const cf = he.customFields;

function wazeUrl(address) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

// זמן — יעד + נותר/חריגה + פס ניצול. משתמש בהיגיון הקיים (lateness/taskTime).
function TimeStripContent({ task }) {
  const range = dateRangeLabel(task);
  const time = dueTimeLabel(task);
  const dueText = range ? `${range}${time ? ` · ${time}` : ''}` : d.noDue ?? he.common.none;

  const est = allocatedMinutes(task);
  const over = isOverTime(task);
  const late = isLate(task);
  let badge = null;
  if (late) badge = { cls: 'bg-dangerLight text-drRed', text: he.dashboard.groupLate };
  else if (over) badge = { cls: 'bg-dangerLight text-drRed', text: d.overrunShort.replace('{n}', overrunMinutes(task)) };
  else if (est) {
    const left = est - usedMinutes(task);
    if (left <= 15) badge = { cls: 'bg-dueSoft text-drOrange', text: d.remaining.replace('{n}', Math.max(0, left)) };
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>{dueText}</span>
        {badge && <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${badge.cls}`}>{badge.text}</span>}
      </div>
      {est > 0 && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full"
            style={{ width: `${over ? 100 : Math.min(100, usagePercent(task))}%`, backgroundColor: over ? '#c53030' : '#188a4e' }}
          />
        </div>
      )}
    </div>
  );
}

export default function DrawerViewBody({
  task, assigneeName, refreshKey, onEvents,
  isAssignee, memberId, orgId, onRefresh,
}) {
  const { events } = useTaskTimeline(task?.id, refreshKey);
  const { fields } = useCustomFields(task?.org_id, 'task');
  const { values } = useCustomFieldValues(task?.org_id, 'task', task?.id);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { onEvents?.(events); }, [events, onEvents]);

  const photos = events.filter((e) => e.type === 'photo' && e.url);
  const voices = events.filter((e) => e.type === 'voice_note' && e.url);
  const mediaCount = photos.length + voices.length;
  const ordered = [...events].reverse();
  const address = task?.address || task?.project?.address;
  const filledFields = fields.filter((f) => values[f.id]);
  const isClosed = ['done', 'cancelled'].includes(task?.status);

  return (
    <div className="pb-2 pt-3">
      {/* כלי ביצוע (מבצע) / מוניטור (אחר) */}
      {isAssignee && !isClosed ? (
        <ExecutionTools task={task} onRefresh={onRefresh} />
      ) : (
        <AssigneeCard task={task} assigneeName={assigneeName} />
      )}

      {/* רצועת יעד/זמן */}
      <InfoStrip label={d.labelDue} color="yellow">
        <TimeStripContent task={task} />
      </InfoStrip>

      {/* רצועת כתובת + WAZE */}
      {address && (
        <InfoStrip
          label={d.labelAddress}
          color="blue"
          action={
            <a
              href={wazeUrl(address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center gap-1 rounded-lg bg-navy px-3 text-sm font-bold text-white"
            >
              <Icon name="project" size="sm" strokeWidth={2} />
              {d.waze}
            </a>
          }
        >
          <span className="text-sm font-medium text-navy">{address}</span>
        </InfoStrip>
      )}

      {/* רצועת הנחיות */}
      {task?.description && (
        <InfoStrip label={d.labelInstructions} color="yellow">
          <p className="whitespace-pre-wrap text-sm text-inkSoft">{task.description}</p>
        </InfoStrip>
      )}

      {/* דרישות לביצוע */}
      {task?.requirements?.length > 0 && (
        <CollapsibleSection label={d.sectionRequirements} count={task.requirements.length} color="yellow">
          <ul className="space-y-1.5">
            {task.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-inkSoft">
                <Icon name="check" size="sm" strokeWidth={2} className="mt-0.5 shrink-0 text-drGreen" />
                {r}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* פרטי משימה — שדות מותאמים כמפתח/ערך */}
      {fields.length > 0 && (
        <CollapsibleSection label={d.sectionDetails} count={filledFields.length} color="black">
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.id} className="flex items-baseline justify-between gap-3">
                <span className="shrink-0 text-sm text-grayMid">{f.label}</span>
                <span className="min-w-0 truncate text-sm font-medium text-navy">{values[f.id] ?? cf.noValue}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* תיעוד ומדיה */}
      <CollapsibleSection label={d.sectionMedia} count={mediaCount} color="blue" defaultOpen={mediaCount > 0}>
        <MediaStrip photos={photos} voices={voices} onPhoto={setLightbox} />
      </CollapsibleSection>

      {/* עצירה וסיום (מבצע) — נפרד, מעל ציר הזמן */}
      {isAssignee && !isClosed && (
        <StopFinishBlock task={task} memberId={memberId} orgId={orgId} onRefresh={onRefresh} />
      )}

      {/* ציר זמן */}
      <CollapsibleSection label={d.sectionTimeline} count={events.length} color="green" defaultOpen>
        <TimelineList events={ordered} onPhoto={setLightbox} />
      </CollapsibleSection>

      {lightbox && (
        <Modal title={he.media.photoAlt} onClose={() => setLightbox(null)}>
          <img src={lightbox} alt={he.media.photoAlt} className="mx-auto max-h-[70vh] rounded-lg" />
        </Modal>
      )}
    </div>
  );
}
