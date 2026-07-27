import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// חברי הארגון הפעילים — להשמת משימה לעובד ולבחירת ראש צוות
export function useOrgMembers(orgId) {
  const [members, setMembers] = useState([]);
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
      .order('full_name')
      .then(({ data }) => {
        setMembers(data ?? []);
        setLoading(false);
      });
  }, [orgId]);

  return { members, loading };
}
