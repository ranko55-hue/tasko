import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// המנהלים בארגון — היעדים האפשריים להקצאת לקוח או עובד.
// admin נכלל: הוא רואה הכל ממילא, אבל הקצאה מפורשת אליו היא בחירה לגיטימית.
export function useOrgManagers(orgId) {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('org_members')
      .select('id, full_name, role')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .in('role', ['admin', 'manager'])
      .order('full_name')
      .then(({ data }) => {
        setManagers(data ?? []);
        setLoading(false);
      });
  }, [orgId]);

  return { managers, loading };
}
