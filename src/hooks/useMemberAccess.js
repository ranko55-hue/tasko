import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// מצב הגישה של עובד: 'active' (נכנס), 'pending' (הזמנה תקפה שטרם מומשה),
// 'expired' (אין הזמנה תקפה — צריך לשלוח מחדש).
export function accessStatusOf(member, latestInvite) {
  if (member?.auth_user_id) return 'active';
  if (latestInvite && !latestInvite.used_at && new Date(latestInvite.expires_at) > new Date()) {
    return 'pending';
  }
  return 'expired';
}

// טוען את פרטי החבר הרלוונטיים לגישה + ההזמנה האחרונה שלו.
export function useMemberAccess(memberId, orgId) {
  const [member, setMember] = useState(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    const [{ data: m }, { data: inv }] = await Promise.all([
      supabase.from('org_members')
        .select('id, full_name, phone, email, auth_user_id').eq('id', memberId).maybeSingle(),
      supabase.from('invites')
        .select('token, expires_at, used_at, created_at')
        .eq('org_member_id', memberId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setMember(m ?? null);
    setInvite(inv ?? null);
    setLoading(false);
  }, [memberId]);

  useEffect(() => { load(); }, [load]);

  // שליחת הזמנה מחדש — טוקן חדש דרך Edge Function.
  async function resend() {
    const resp = await supabase.functions.invoke('manage-member', {
      body: { action: 'resend', org_id: orgId, member_id: memberId },
    });
    if (resp.error) throw resp.error;
    if (resp.data?.error) throw new Error(resp.data.error);
    await load();
    return resp.data.token;
  }

  return {
    member, invite, loading,
    status: accessStatusOf(member, invite),
    resend, reload: load,
  };
}

// בונה את קישור ההזמנה המלא מטוקן.
export function inviteUrl(token) {
  return `${window.location.origin}/welcome/${token}`;
}
