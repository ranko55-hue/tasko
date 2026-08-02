import { useRef, useState } from 'react';
import { he } from '../../locales/he';
import { useProjectFiles } from '../../hooks/useProjectFiles';
import Button from '../shared/Button';
import ProjectFileRow from './ProjectFileRow';

const f = he.projectDetail.files;

// לשונית "קבצים" — מנהלים בלבד. ההסתרה כאן היא נוחות; ההגנה עצמה ב-RLS
// (מיגרציה 012), ולכן עובד שיפנה ישירות ל-API יקבל רשימה ריקה.
export default function ProjectFilesTab({ project, memberId }) {
  const { files, loading, error, addFile, removeFile } = useProjectFiles(project?.id);
  const inputRef = useRef(null);
  const [percent, setPercent] = useState(null);
  const [failure, setFailure] = useState('');

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // כדי שבחירת אותו קובץ שוב תפעיל onChange
    if (!file || !project) return;
    setFailure('');
    setPercent(0);
    try {
      await addFile(project, file, memberId, setPercent);
    } catch {
      setFailure(f.uploadError);
    }
    setPercent(null);
  }

  async function onRemove(row) {
    if (!window.confirm(f.confirmRemove.replace('{name}', row.file_name))) return;
    setFailure('');
    try {
      await removeFile(row);
    } catch {
      setFailure(f.deleteError);
    }
  }

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" onChange={onPick} className="hidden" />
      <Button variant="yellow" fullWidth={false} disabled={percent !== null} onClick={() => inputRef.current?.click()}>
        {percent === null ? f.upload : f.uploading.replace('{percent}', percent)}
      </Button>

      {failure && (
        <p className="rounded-lg bg-red-50 px-3 py-3 font-medium text-red-700">{failure}</p>
      )}

      {error ? (
        <p className="py-8 text-center text-red-600">{f.loadError}</p>
      ) : loading ? (
        <p className="py-8 text-center text-slate-500">{he.common.loading}</p>
      ) : files.length === 0 ? (
        <p className="py-8 text-center text-slate-400">{f.empty}</p>
      ) : (
        <div className="space-y-2">
          {files.map((row) => (
            <ProjectFileRow key={row.id} row={row} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
