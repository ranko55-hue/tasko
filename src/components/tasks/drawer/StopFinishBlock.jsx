import { useState } from 'react';
import { he } from '../../../locales/he';
import { useOrgSettings } from '../../../hooks/useOrgSettings';
import {
  isLocked,
  elapsedSeconds,
  startTask,
  pauseTask,
  resumeTask,
  finishTask,
  finishForApproval,
  blockTask,
  unblockTask,
} from '../../../lib/taskFlow';
import { formatDuration } from '../../../lib/time';
import Button from '../../shared/Button';
import Modal from '../../shared/Modal';
import Icon from '../../ui/Icon';
import TextEntryModal from '../../worker/TextEntryModal';

const w = he.worker;
const d = he.tasks.drawer;

const BTN =
  'flex w-full items-center justify-center gap-2 rounded-lg px-4 font-bold shadow-[0_2px_0_rgba(0,0,0,0.18)] transition-transform active:translate-y-0.5';

// עצירה וסיום — בלוק עצמאי מעל ציר הזמן. שליטת עבודה של המבצע:
// התחלה/המשך/הפסקה/סיום/חזרה-מעיכוב/דיווח-עיכוב. אותן פונקציות קיימות.
export default function StopFinishBlock({ task, memberId, orgId, onRefresh }) {
  const { settings } = useOrgSettings(orgId);
  const [modal, setModal] = useState(null);
  const locked = isLocked(task);
  const isClosed = ['done', 'cancelled'].includes(task.status);
  const st = task.status;

  if (isClosed) return null;

  async function run(fn) {
    await fn(task, memberId);
    onRefresh();
  }
  async function confirmFinish() {
    const fn = settings.require_approval ? finishForApproval : finishTask;
    await fn(task, memberId);
    setModal(null);
    onRefresh();
  }
  async function sendDelay(text) {
    await blockTask(task, memberId, text);
    setModal(null);
    onRefresh();
  }

  // ממתינה לאישור — העובד רואה הודעה בלבד
  if (st === 'pending_approval') {
    return (
      <div className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-drLine bg-white p-3 sm:mx-6">
        <span className="absolute inset-y-0 right-0 w-1 bg-drRed" aria-hidden="true" />
        <div className="rounded-lg bg-purple-50 px-4 py-3 text-center text-sm font-bold text-purple-700">
          {w.pendingApprovalMsg}
        </div>
      </div>
    );
  }

  const finishBtn = (
    <button type="button" onClick={() => setModal('finish')} className={`${BTN} min-h-[78px] flex-col bg-drRed text-white`}>
      <span className="flex items-center gap-2">
        <Icon name="pauseBars" className="h-6 w-6" strokeWidth={2} />
        {w.finish}
      </span>
      <span className="text-xs font-medium opacity-90">{d.finishSubline}</span>
    </button>
  );
  const pauseBtn = (
    <button type="button" onClick={() => run(pauseTask)} className={`${BTN} min-h-[62px] bg-drYellow text-drInk`}>
      <Icon name="pause" className="h-6 w-6" strokeWidth={2} />
      {w.pause}
    </button>
  );

  return (
    <div className="relative mx-4 mb-3 overflow-hidden rounded-lg border border-drLine bg-white p-3 sm:mx-6">
      <span className="absolute inset-y-0 right-0 w-1 bg-drRed" aria-hidden="true" />
      <div className="mb-2 text-[10.5px] font-bold tracking-wide text-grayMid">{d.stopFinishTitle}</div>

      {locked ? (
        <div className="rounded-lg bg-appBg px-4 py-3 text-center text-sm font-bold text-grayDark">
          {w.lockedUntil.replace('{date}', '')}
        </div>
      ) : (
        <div className="space-y-2">
          {(st === 'pending' || st === 'scheduled') && (
            <button type="button" onClick={() => run(startTask)} className={`${BTN} min-h-[62px] bg-drGreen text-white`}>
              <Icon name="play" className="h-6 w-6" strokeWidth={2} />
              {w.start}
            </button>
          )}
          {st === 'in_progress' && (<>{finishBtn}{pauseBtn}</>)}
          {st === 'paused' && (
            <>
              <button type="button" onClick={() => run(resumeTask)} className={`${BTN} min-h-[62px] bg-drGreen text-white`}>
                <Icon name="play" className="h-6 w-6" strokeWidth={2} />
                {w.resume}
              </button>
              {finishBtn}
            </>
          )}
          {st === 'blocked' && (
            <button type="button" onClick={() => run(unblockTask)} className={`${BTN} min-h-[62px] bg-drGreen text-white`}>
              <Icon name="play" className="h-6 w-6" strokeWidth={2} />
              {w.unblock}
            </button>
          )}
          {st !== 'blocked' && (
            <Button variant="danger" onClick={() => setModal('delay')}>{w.reportDelay}</Button>
          )}
        </div>
      )}

      {modal === 'finish' && (
        <Modal title={w.finishTitle} onClose={() => setModal(null)}>
          <p className="mb-6 text-lg text-inkSoft">
            {w.finishBody.replace('{time}', formatDuration(elapsedSeconds(task)))}
          </p>
          <div className="space-y-3">
            <Button size="lg" onClick={confirmFinish}>{w.confirmFinish}</Button>
            <Button variant="ghost" onClick={() => setModal(null)}>{he.common.cancel}</Button>
          </div>
        </Modal>
      )}
      {modal === 'delay' && (
        <TextEntryModal
          title={w.delayTitle}
          placeholder={w.delayPlaceholder}
          submitLabel={w.sendDelay}
          variant="danger"
          onSubmit={sendDelay}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
