import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useEmployeeDocuments(memberId, orgId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!memberId || !orgId) return;
    setLoading(true);

    const { data } = await supabase
      .from('employee_documents')
      .select('id, name, file_path, mime_type, expires_at, created_at, uploader:org_members!employee_documents_uploaded_by_fkey(full_name)')
      .eq('member_id', memberId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    setDocuments(data ?? []);
    setLoading(false);
  }, [memberId, orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  async function addDocument(meta) {
    const { error } = await supabase.from('employee_documents').insert({
      org_id: orgId,
      member_id: memberId,
      uploaded_by: meta.uploaded_by,
      name: meta.name,
      file_path: meta.file_path,
      mime_type: meta.mime_type,
      expires_at: meta.expires_at || null,
    });
    if (error) throw error;
    await fetch();
  }

  async function removeDocument(doc) {
    await supabase.storage.from('employee-docs').remove([doc.file_path]);
    const { error } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if (error) throw error;
    await fetch();
  }

  return { documents, loading, addDocument, removeDocument, refetch: fetch };
}
