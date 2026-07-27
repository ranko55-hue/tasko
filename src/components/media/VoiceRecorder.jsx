import { useEffect, useRef, useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';
import { pickAudioType, MAX_RECORDING_SECONDS } from '../../lib/audioRecorder';
import { uploadTaskMedia } from '../../lib/media';
import { addVoiceNote } from '../../lib/taskFlow';
import { formatDuration } from '../../lib/time';
import Button from '../shared/Button';

// מסך הקלטה — נקודה אדומה פועמת + טיימר + כפתור ענק "סיום".
export default function VoiceRecorder({ task, onDone, onCancel }) {
  const { member } = useOrg();
  const [phase, setPhase] = useState('starting'); // starting|recording|uploading|error
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState('');
  const rec = useRef({});

  useEffect(() => {
    start();
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cleanup() {
    clearInterval(rec.current.timer);
    rec.current.stream?.getTracks().forEach((t) => t.stop());
  }

  async function start() {
    if (typeof MediaRecorder === 'undefined') {
      setError(he.media.voiceUnsupported);
      return setPhase('error');
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mimeType, ext } = pickAudioType();
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => handleStop(chunks, mr.mimeType || mimeType, ext);
      mr.start();
      rec.current = {
        stream,
        mr,
        timer: setInterval(
          () => setSecs((s) => (s + 1 >= MAX_RECORDING_SECONDS ? (stop(), s + 1) : s + 1)),
          1000
        ),
      };
      setPhase('recording');
    } catch {
      setError(he.media.errors.mic);
      setPhase('error');
    }
  }

  function stop() {
    clearInterval(rec.current.timer);
    if (rec.current.mr && rec.current.mr.state !== 'inactive') rec.current.mr.stop();
  }

  async function handleStop(chunks, type, ext) {
    setPhase('uploading');
    rec.current.stream?.getTracks().forEach((t) => t.stop());
    try {
      const blob = new Blob(chunks, { type: type || 'audio/webm' });
      const path = await uploadTaskMedia(task, ext, blob, blob.type);
      await addVoiceNote(task, member.id, path);
      onDone();
    } catch (err) {
      setError(err.message === 'network' ? he.media.errors.network : he.media.errors.upload);
      setPhase('error');
    }
  }

  if (phase === 'error') {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-red-50 px-3 py-3 text-red-700">{error}</p>
        <Button variant="ghost" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    );
  }

  if (phase === 'uploading') {
    return (
      <p className="py-8 text-center text-lg text-slate-500">{he.media.uploading}</p>
    );
  }

  return (
    <div className="space-y-6 py-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-4 w-4 animate-pulse rounded-full bg-statusRed" />
        <span className="font-mono text-4xl font-bold tabular-nums text-slate-900">
          {formatDuration(secs)}
        </span>
      </div>
      <p className="text-slate-500">{he.media.recording}</p>
      <Button size="lg" variant="danger" onClick={stop}>
        {he.media.stopSave}
      </Button>
    </div>
  );
}
