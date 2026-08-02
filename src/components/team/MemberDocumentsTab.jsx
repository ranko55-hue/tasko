import { useState, useRef } from 'react';
import { useOrg } from '../../lib/orgContext';
import { uploadEmployeeDoc, signedDocUrl } from '../../lib/employeeDocs';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';
import Modal from '../shared/Modal';

const t = he.team.detail;

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function expiryStatus(expiresAt) {
  if (!expiresAt) return null;
  const d = new Date(expiresAt);
  const now = new Date();
  const diff = (d - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff < 30) return 'soon';
  return 'ok';
}

export default function MemberDocumentsTab({ memberId, orgId, documents, loading, onAdd, onRemove }) {
  const { member: me } = useOrg();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadModal, setUploadModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setDocName(file.name.replace(/\.[^.]+$/, ''));
    setUploadModal(true);
  }

  async function upload() {
    if (!pendingFile || !docName.trim()) return;
    setUploading(true);
    setError('');
    try {
      const { path, mime } = await uploadEmployeeDoc(orgId, memberId, pendingFile, setProgress);
      await onAdd({
        uploaded_by: me.id,
        name: docName.trim(),
        file_path: path,
        mime_type: mime,
        expires_at: docExpiry || null,
      });
      setUploadModal(false);
      setPendingFile(null);
      setDocName('');
      setDocExpiry('');
    } catch {
      setError(t.docsUploadError);
    }
    setUploading(false);
    setProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDownload(doc) {
    try {
      const url = await signedDocUrl(doc.file_path);
      window.open(url, '_blank');
    } catch {
      // silent
    }
  }

  async function handleRemove() {
    if (!confirmRemove) return;
    try {
      await onRemove(confirmRemove);
    } catch {
      setError(t.docsDeleteError);
    }
    setConfirmRemove(null);
  }

  if (loading) return <p className="py-8 text-center text-grayMid">{he.common.loading}</p>;

  return (
    <div>
      <div className="mb-4">
        <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
        <div className="w-40">
          <Button onClick={() => fileRef.current?.click()}>{t.docsUpload}</Button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-urgentSoft px-3 py-2 text-sm font-medium text-urgentInk">{error}</p>
      )}

      {documents.length === 0 ? (
        <p className="py-8 text-center text-sm text-grayLight">{t.docsEmpty}</p>
      ) : (
        <div className="divide-y divide-line">
          {documents.map((doc) => {
            const exp = expiryStatus(doc.expires_at);
            return (
              <div key={doc.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy">{doc.name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-grayMid">
                    <span>{fmtDate(doc.created_at)}</span>
                    {doc.uploader?.full_name && <span>· {doc.uploader.full_name}</span>}
                    {doc.expires_at && (
                      <span className={
                        exp === 'expired' ? 'font-bold text-danger' :
                        exp === 'soon' ? 'font-bold text-yellow-600' : ''
                      }>
                        · {t.docsExpires}: {fmtDate(doc.expires_at)}
                        {exp === 'expired' && ` (${t.docsExpired})`}
                        {exp === 'soon' && ` (${t.docsExpiresSoon})`}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" fullWidth={false} onClick={() => handleDownload(doc)}>
                  {he.projectDetail.files.download}
                </Button>
                <Button variant="ghostDanger" size="sm" fullWidth={false} onClick={() => setConfirmRemove(doc)}>
                  {he.projectDetail.files.remove}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {uploadModal && (
        <Modal title={t.docsUpload} onClose={() => { setUploadModal(false); setPendingFile(null); }}>
          <div className="space-y-4">
            <Field label={t.docsName} value={docName} onChange={setDocName} />
            <Field label={`${t.docsExpiresAt} ${he.common.optional}`} type="date" value={docExpiry} onChange={setDocExpiry} />
            {uploading && (
              <p className="text-sm text-brand">{t.docsUploading.replace('{percent}', progress)}</p>
            )}
            <div className="flex gap-3">
              <Button onClick={upload} disabled={uploading || !docName.trim()}>
                {uploading ? he.common.loading : he.common.save}
              </Button>
              <Button variant="ghost" onClick={() => { setUploadModal(false); setPendingFile(null); }}>
                {he.common.cancel}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmRemove && (
        <Modal title={he.projectDetail.files.remove} onClose={() => setConfirmRemove(null)}>
          <p className="mb-4 text-sm text-inkSoft">
            {t.docsConfirmRemove.replace('{name}', confirmRemove.name)}
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleRemove}>{he.projectDetail.files.remove}</Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)}>{he.common.cancel}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
