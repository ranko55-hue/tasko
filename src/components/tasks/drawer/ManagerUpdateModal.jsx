import { useRef, useState } from 'react';
import { useOrg } from '../../../lib/orgContext';
import { he } from '../../../locales/he';
import { compressImage } from '../../../lib/imageCompress';
import { uploadTaskMedia } from '../../../lib/media';
import { addManagerUpdate } from '../../../lib/taskFlow';
import Button from '../../shared/Button';
import Modal from '../../shared/Modal';
import Textarea from '../../shared/Textarea';
import Icon from '../../ui/Icon';

const d = he.tasks.drawer;

// עדכון מנהל לעובד — הודעה + צירוף אופציונלי. נשמר כאירוע manager_attachment,
// ולכן מופיע לעובד ב-/my ובציר הזמן עם נקודה צהובה.
export default function ManagerUpdateModal({ task, onClose, onSent }) {
  const { member } = useOrg();
  const fileRef = useRef(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    setError('');
    if (!text.trim()) return setError(d.noteRequired);

    setBusy(true);
    try {
      let path = null;
      if (file) {
        // תמונה נדחסת כמו בצילום ביצוע; קובץ אחר נשלח כפי שהוא
        const isImage = file.type.startsWith('image/');
        const blob = isImage ? await compressImage(file) : file;
        const ext = isImage ? 'jpg' : (file.name.split('.').pop() || 'bin');
        setProgress(0);
        path = await uploadTaskMedia(task, ext, blob, blob.type, setProgress);
      }
      await addManagerUpdate(task, member.id, text.trim(), path);
      onSent();
    } catch (err) {
      setError(err?.message === 'network' ? he.media.errors.network : d.sendFailed);
      setProgress(null);
      setBusy(false);
    }
  }

  return (
    <Modal title={d.managerUpdateTitle} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">{d.managerUpdateHint}</p>

        <Textarea label="" value={text} onChange={setText} placeholder={d.notePlaceholder} rows={4} />

        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />

        {file ? (
          <div className="flex items-center gap-2 rounded-lg border border-line bg-slate-50 px-3 py-2">
            <Icon name="task" size="sm" className="text-slate-500" />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              aria-label={d.removeAttachment}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        ) : (
          <Button variant="dashed" size="sm" onClick={() => fileRef.current?.click()}>
            {d.attach}
          </Button>
        )}

        {progress !== null && (
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
          <Button disabled={busy} fullWidth={false} className="flex-1" onClick={send}>
            {busy ? he.common.loading : d.send}
          </Button>
          <Button variant="secondary" fullWidth={false} onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
