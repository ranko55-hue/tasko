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
  // starting = ממתין לאישור מיקרופון. מצב ההקלטה מוצג רק אחרי ש-getUserMedia הצליח,
  // אחרת המשתמש רואה טיימר רץ בזמן שדבר לא מוקלט.
  const [phase, setPhase] = useState('starting'); // starting|recording|uploading|error
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [canRetry, setCanRetry] = useState(false);
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
    setError('');
    setHint('');
    setCanRetry(false);
    setSecs(0);
    setPhase('starting');
    try {
      // עד שההרשאה מאושרת בפועל נשארים ב-starting ולא מציגים מצב הקלטה
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
    } catch (err) {
      // NotAllowedError = המשתמש דחה או שההרשאה חסומה; NotFoundError = אין מיקרופון
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setError(he.media.errors.micDenied);
        setHint(he.media.errors.micDeniedHint);
      } else if (err?.name === 'NotFoundError') {
        setError(he.media.errors.micNotFound);
      } else {
        setError(he.media.errors.mic);
      }
      setCanRetry(true);
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
        <p className="rounded-lg bg-urgentSoft px-3 py-3 font-medium text-urgentInk">{error}</p>
        {hint && <p className="px-1 text-sm text-grayDark">{hint}</p>}
        {canRetry && <Button onClick={start}>{he.common.retry}</Button>}
        <Button variant="ghost" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    );
  }

  if (phase === 'uploading') {
    return (
      <p className="py-8 text-center text-lg text-grayMid">{he.media.uploading}</p>
    );
  }

  // ממתין לאישור המיקרופון — בלי נקודה אדומה ובלי טיימר, כדי שלא ייראה כמקליט
  if (phase === 'starting') {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-lg font-bold text-inkSoft">{he.media.waitingMic}</p>
        <p className="text-sm text-grayMid">{he.media.waitingMicHint}</p>
        <Button variant="ghost" onClick={onCancel}>
          {he.common.cancel}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 text-center">
      <div className="flex items-center justify-center gap-3">
        <span className="h-4 w-4 animate-pulse rounded-full bg-statusRed" />
        <span className="font-mono text-4xl font-bold tabular-nums text-navy">
          {formatDuration(secs)}
        </span>
      </div>
      <p className="text-grayMid">{he.media.recording}</p>
      <Button size="lg" variant="danger" onClick={stop}>
        {he.media.stopSave}
      </Button>
    </div>
  );
}
