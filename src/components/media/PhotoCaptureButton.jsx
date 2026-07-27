import { useRef, useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';
import { compressImage } from '../../lib/imageCompress';
import { uploadTaskMedia } from '../../lib/media';
import { addPhotoEvent } from '../../lib/taskFlow';

// צילום ביצוע — מצלמה → דחיסה → העלאה עם חיווי → אירוע photo
export default function PhotoCaptureButton({ task, onDone }) {
  const { member } = useOrg();
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  async function onChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      const blob = await compressImage(file);
      if (blob.size > 20 * 1024 * 1024) return setError(he.media.errors.tooLarge);
      setProgress(0);
      const path = await uploadTaskMedia(task, 'jpg', blob, 'image/jpeg', setProgress);
      await addPhotoEvent(task, member.id, path);
      setProgress(null);
      onDone?.();
    } catch (err) {
      setProgress(null);
      setError(err.message === 'network' ? he.media.errors.network : he.media.errors.upload);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        disabled={progress !== null}
        onClick={() => inputRef.current.click()}
        className="min-h-touch w-full rounded-xl border-2 border-brand bg-white px-4 text-lg font-bold text-brand hover:bg-brand/5 disabled:opacity-50"
      >
        {progress !== null ? `${he.media.uploading} ${progress}%` : he.media.photoCapture}
      </button>

      {progress !== null && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-brand transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
