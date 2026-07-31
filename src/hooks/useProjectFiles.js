import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadProjectFile, removeStoredFile } from '../lib/projectFiles';

// קבצי פרויקט — רשימה, העלאה ומחיקה. ה-RLS (מיגרציה 012) מחזיר ריק
// למי שאינו מנהל, ולכן ההסתרה ב-UI היא נוחות ולא שכבת ההגנה.
export function useProjectFiles(projectId, enabled = true) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: err } = await supabase
      .from('project_files')
      .select('*, uploader:org_members!project_files_uploaded_by_fkey(full_name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    setError(!!err);
    setFiles(data ?? []);
    setLoading(false);
  }, [projectId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  async function addFile(project, file, memberId, onProgress) {
    const path = await uploadProjectFile(project, file, onProgress);
    const { error: err } = await supabase.from('project_files').insert({
      org_id: project.org_id,
      project_id: project.id,
      path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size ?? null,
      uploaded_by: memberId,
    });
    // הרשומה נכשלה אחרי שהקובץ כבר עלה — מסירים אותו כדי לא להשאיר יתום
    if (err) {
      await removeStoredFile(path).catch(() => {});
      throw err;
    }
    await load();
  }

  async function removeFile(row) {
    const { error: err } = await supabase.from('project_files').delete().eq('id', row.id);
    if (err) throw err;
    await removeStoredFile(row.path).catch(() => {});
    setFiles((prev) => prev.filter((f) => f.id !== row.id));
  }

  return { files, loading, error, addFile, removeFile, refetch: load };
}
