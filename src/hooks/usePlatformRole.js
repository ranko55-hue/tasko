import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// בודק אם המשתמש המחובר הוא super-admin (platform_admins).
// מחזיר { isPlatformAdmin, loading }.
export function usePlatformRole(userId) {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsPlatformAdmin(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc('is_platform_admin');
      if (!cancelled) {
        setIsPlatformAdmin(!!data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  return { isPlatformAdmin, loading };
}
