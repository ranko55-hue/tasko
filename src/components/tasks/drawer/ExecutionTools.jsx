import { useEffect, useRef, useState } from 'react';
import { he } from '../../../locales/he';
import { useOrg } from '../../../lib/orgContext';
import { elapsedSeconds, addPhotoEvent } from '../../../lib/taskFlow';
import { formatDuration } from '../../../lib/time';
import { isRunning } from '../../../lib/taskTime';
import { compressImage } from '../../../lib/imageCompress';
import { uploadTaskMedia } from '../../../lib/media';
import Icon from '../../ui/Icon';
import NoteModal from '../../media/NoteModal';

const d = he.tasks.drawer;

// אריח כפפה — min-height 72, אייקון 26 מעל הטקסט, צל תחתון 2px, active שוקע.
const TILE =
  'flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg px-3 text-sm font-bold ' +
  'shadow-[0_2px_0_rgba(0,0,0,0.18)] transition-transform active:translate-y-0.5 disabled:opacity-60';

function Tile({ color, icon, label, onClick, disabled, full }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${TILE} ${color} ${full ? 'col-span-2 w-full' : ''}`}
    >
      <Icon name={icon} className="h-[26px] w-[26px]" strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}

// כרטיס כלי הביצוע — טיימר גדול + אריחי תיעוד. למבצע במצב פעיל בלבד.
export default function ExecutionTools({ task, onRefresh }) {
  const { member } = useOrg();
  const [modal, setModal] = useState(null); // 'note' | 'voice'
  const [uploading, setUploading] = useState(false);
  const [, setTick] = useState(0);
  const inputRef = useRef(null);
  const running = isRunning(task);

  // טיק לטיימר כשהמשימה רצה
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setUploading(true);
      const blob = await compressImage(file);
      const path = await uploadTaskMedia(task, 'jpg', blob, 'image/jpeg', () => {});
      await addPhotoEvent(task, member.id, path);
      onRefresh?.();
    } catch {
      /* שקט — שגיאה תיראה כהיעדר האירוע החדש; הזרימה זהה לקיים */
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-4 mb-3 rounded-lg border border-drLine bg-white p-3 sm:mx-6">
      {/* טיימר */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-grayMid">{d.netTimeLabel}</span>
        {running && (
          <span className="flex items-center gap-1 text-xs font-bold text-drGreen">
            <span className="h-2 w-2 rounded-full bg-drGreen animate-softPulse" />
            {d.runningNow}
          </span>
        )}
      </div>
      <div
        className={`mt-1 text-center text-[44px] font-extrabold leading-none ${running ? 'text-drGreen' : 'text-drInk'}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatDuration(elapsedSeconds(task))}
      </div>

      {/* תווית אזור תיעוד + אריחים */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10.5px] font-bold tracking-wide text-grayMid">{d.execDoc}</span>
        <span className="h-px flex-1 bg-drLine" aria-hidden="true" />
      </div>

      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Tile color="bg-drBlue text-white" icon="camera" label={uploading ? he.media.uploading : d.tilePhoto} disabled={uploading} onClick={() => inputRef.current?.click()} />
        <Tile color="bg-drGreen text-white" icon="mic" label={d.tileVoice} onClick={() => setModal('voice')} />
        <Tile color="bg-drInk text-white" icon="report" label={d.tileNote} full onClick={() => setModal('note')} />
      </div>

      {modal === 'note' && (
        <NoteModal task={task} initialMode="text" onClose={() => setModal(null)} onDone={() => { setModal(null); onRefresh?.(); }} />
      )}
      {modal === 'voice' && (
        <NoteModal task={task} initialMode="record" onClose={() => setModal(null)} onDone={() => { setModal(null); onRefresh?.(); }} />
      )}
    </div>
  );
}
