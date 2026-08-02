import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { useOrgSettings } from '../../hooks/useOrgSettings';
import { he } from '../../locales/he';
import { formatDateTime, formatDuration } from '../../lib/time';
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
} from '../../lib/taskFlow';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import TaskTimer from './TaskTimer';
import TaskActionBar from './TaskActionBar';
import TextEntryModal from './TextEntryModal';
import PhotoCaptureButton from '../media/PhotoCaptureButton';
import NoteModal from '../media/NoteModal';
import TaskTimeline from '../media/TaskTimeline';
import Icon from '../ui/Icon';

const w = he.worker;

// גוף הכרטיס הפתוח: יעד בולט, טיימר, דרישות, צוות, מדיה, יומן, ופעולות לפי מצב.
export default function MyTaskCard({ task, onUpdated }) {
  const { member } = useOrg();
  const { settings } = useOrgSettings(member?.org_id);
  const [modal, setModal] = useState(null); // 'finish' | 'note' | 'delay' | 'reqs'
  const [showTimeline, setShowTimeline] = useState(false);
  const [tlKey, setTlKey] = useState(0);
  const locked = isLocked(task);
  const activeForMedia = ['in_progress', 'paused'].includes(task.status);
  const showTimer = ['in_progress', 'paused', 'blocked', 'done'].includes(
    task.status
  );

  const refreshTimeline = () => {
    setTlKey((k) => k + 1);
    setModal(null);
  };

  const run = (fn) => async () => onUpdated(await fn(task, member.id));

  const actions = {
    onStart: run(startTask),
    onPause: run(pauseTask),
    onResume: run(resumeTask),
    onUnblock: run(unblockTask),
    onFinish: () => setModal('finish'),
    onNote: () => setModal('note'),
    onDelay: () => setModal('delay'),
  };

  async function confirmFinish() {
    const fn = settings.require_approval ? finishForApproval : finishTask;
    onUpdated(await fn(task, member.id));
    setModal(null);
  }
  async function sendDelay(text) {
    onUpdated(await blockTask(task, member.id, text));
    setModal(null);
  }

  return (
    <div className="space-y-4 border-t border-slate-100 p-4">
      {/* יעד לסיום — בולט */}
      <div className="rounded-xl bg-amber-50 px-4 py-3">
        <div className="text-sm text-amber-700">{w.due}</div>
        <div className="text-xl font-extrabold text-amber-900">
          {formatDateTime(task.due_at) ?? w.noDue}
        </div>
      </div>

      {task.required_workers > 1 && (
        <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800">
          {w.team.replace('{n}', task.required_workers)}
        </span>
      )}

      {task.description && (
        <p className="whitespace-pre-wrap text-lg text-slate-700">
          {task.description}
        </p>
      )}
      {task.address && <p className="text-slate-500">{task.address}</p>}

      {(task.requirements?.length ?? 0) > 0 && (
        <Button variant="outline" onClick={() => setModal('reqs')}>
          {w.requirements.replace('{n}', task.requirements.length)}
        </Button>
      )}

      {showTimer && <TaskTimer task={task} />}

      {locked ? (
        <div className="rounded-xl bg-slate-100 px-4 py-4 text-center text-lg font-bold text-slate-600">
          <Icon name="lock" size="sm" />
          {w.lockedUntil.replace('{date}', formatDateTime(task.scheduled_start_at))}
        </div>
      ) : task.status === 'done' ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-4 text-center text-lg font-bold text-emerald-800">
          <Icon name="check" size="sm" className="inline-block" /> {w.doneLabel}
        </div>
      ) : (
        <TaskActionBar task={task} locked={locked} actions={actions} />
      )}

      {activeForMedia && !locked && (
        <PhotoCaptureButton task={task} onDone={refreshTimeline} />
      )}

      <div>
        <Button variant="outline" onClick={() => setShowTimeline((v) => !v)}>
          {he.media.openTimeline}
        </Button>
        {showTimeline && (
          <div className="mt-3">
            <TaskTimeline key={tlKey} taskId={task.id} />
          </div>
        )}
      </div>

      {modal === 'reqs' && (
        <Modal title={w.requirementsTitle} onClose={() => setModal(null)}>
          <ul className="space-y-2">
            {task.requirements.map((r, i) => (
              <li
                key={i}
                className="rounded-xl bg-slate-50 px-4 py-3 text-lg text-slate-800"
              >
                {r}
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === 'finish' && (
        <Modal title={w.finishTitle} onClose={() => setModal(null)}>
          <p className="mb-5 text-lg text-slate-700">
            {w.finishBody.replace('{time}', formatDuration(elapsedSeconds(task)))}
          </p>
          <div className="space-y-3">
            <Button size="lg" onClick={confirmFinish}>
              {w.confirmFinish}
            </Button>
            <Button variant="ghost" onClick={() => setModal(null)}>
              {he.common.cancel}
            </Button>
          </div>
        </Modal>
      )}

      {modal === 'note' && (
        <NoteModal
          task={task}
          onDone={refreshTimeline}
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
