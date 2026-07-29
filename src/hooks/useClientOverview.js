import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// סיכום הלקוחות למסך הטבלאי — שאילתה אחת מול client_overview (מיגרציה 007),
// במקום שאילתת מונים לכל לקוח בנפרד.
export function useClientOverview(orgId) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    const { data, error: err } = await supabase
      .from('client_overview')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (err) {
      console.error('useClientOverview', err.code ?? '', err.message);
      setError(true);
    } else {
      setRows(data ?? []);
      setError(false);
    }
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return { rows, loading, error, refetch: load };
}
