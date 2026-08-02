import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function usePlatformOrgs() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.rpc('platform_list_orgs');
    if (err) {
      setError(err);
      setOrgs([]);
    } else {
      setError(null);
      setOrgs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { orgs, loading, error, refetch: fetch };
}

export function usePlatformOrgMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMembers = useCallback(async (orgId) => {
    setLoading(true);
    const { data, error } = await supabase.rpc('platform_org_members', { p_org_id: orgId });
    if (!error) setMembers(data || []);
    setLoading(false);
    return { data: data || [], error };
  }, []);

  return { members, loading, fetchMembers };
}

export function useToggleMember() {
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(async (memberId, active) => {
    setBusy(true);
    const { error } = await supabase.rpc('platform_toggle_member', {
      p_member_id: memberId,
      p_active: active,
    });
    setBusy(false);
    return { error };
  }, []);

  return { toggle, busy };
}
