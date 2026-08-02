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
import TaskTimer from '../../worker/TaskTimer';
import TaskActionBar from '../../worker/TaskActionBar';
import NoteModal from '../../media/NoteModal';
import TextEntryModal from '../../worker/TextEntryModal';
import PhotoCaptureButton from '../../media/PhotoCaptureButton';

const w = he.worker;
const d = he.dashboard;

export default function DrawerExecutionBar({ task, memberId, orgId, onRefresh }) {
  const { settings } = useOrgSettings(orgId);
  const [modal, setModal] = useState(null);
  const locked = isLocked(task);
  const showTimer = ['in_progress', 'paused', 'blocked', 'done'].includes(task.status);
  const activeForMedia = ['in_progress', 'paused'].includes(task.status);
  const isClosed = ['done', 'cancelled'].includes(task.status);

  if (isClosed) return null;

  async function run(fn) {
    await fn(task, memberId);
    onRefresh();
  }

  const actions = {
    onStart: () => run(startTask),
    onPause: () => run(pauseTask),
    onResume: () => run(resumeTask),
    onUnblock: () => run(unblockTask),
    onFinish: () => setModal('finish'),
    onNote: () => setModal('note'),
    onDelay: () => setModal('delay'),
  };

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

  return (
    <div className="space-y-3 border-b border-line bg-slate-50/60 px-4 py-3 sm:px-5">
      <h4 className="text-xs font-black text-slate-400">{d.executionSection}</h4>

      {showTimer && <TaskTimer task={task} />}

      {!locked && <TaskActionBar task={task} locked={locked} actions={actions} />}

      {activeForMedia && !locked && (
        <PhotoCaptureButton task={task} onDone={onRefresh} />
      )}

      {locked && (
        <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-600">
          {w.lockedUntil.replace('{date}', '')}
        </div>
      )}

      {modal === 'finish' && (
        <Modal title={w.finishTitle} onClose={() => setModal(null)}>
          <p className="mb-5 text-lg text-slate-700">
            {w.finishBody.replace('{time}', formatDuration(elapsedSeconds(task)))}
          </p>
          <div className="space-y-3">
            <Button size="lg" onClick={confirmFinish}>{w.confirmFinish}</Button>
            <Button variant="ghost" onClick={() => setModal(null)}>{he.common.cancel}</Button>
          </div>
        </Modal>
      )}

      {modal === 'note' && (
        <NoteModal
          task={task}
          onDone={() => { setModal(null); onRefresh(); }}
          onClose={() => setModal(null)}
        />
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
