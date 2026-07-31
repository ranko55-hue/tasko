import { useEffect, useState } from 'react';
import { he } from '../../locales/he';
import { formatDate } from '../../lib/time';
import { signedFileUrl, isImage } from '../../lib/projectFiles';
import Icon from '../ui/Icon';

const f = he.projectDetail.files;

// שורת קובץ — ממוזערת לתמונה, אייקון לכל השאר, ופעולות הורדה ומחיקה.
export default function ProjectFileRow({ row, onRemove }) {
  const [url, setUrl] = useState(null);
  const image = isImage(row.mime_type);

  // כתובת חתומה נמשכת פעם אחת לשורה; ה-bucket פרטי ואין כתובת קבועה.
  useEffect(() => {
    let alive = true;
    signedFileUrl(row.path)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [row.path]);

  const uploader = row.uploader?.full_name || f.unknownUploader;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
        {image && url ? (
          <img src={url} alt={row.file_name} className="h-full w-full object-cover" />
        ) : (
          <Icon name="doc" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-slate-900">{row.file_name}</div>
        <div className="mt-0.5 truncate text-sm text-slate-500">
          {formatDate(row.created_at)} · {f.uploadedBy.replace('{name}', uploader)}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {url && (
          <a
            href={url}
            download={row.file_name}
            className="flex min-h-touch items-center rounded-lg bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
          >
            {f.download}
          </a>
        )}
        <button
          type="button"
          onClick={() => onRemove(row)}
          className="flex min-h-touch items-center rounded-lg px-3 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          {f.remove}
        </button>
      </div>
    </div>
  );
}
