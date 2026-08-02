import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// פניות תמיכה — שתי גישות:
// 1. submitTicket: כל משתמש מארגון יכול לפתוח פנייה (INSERT ישיר).
// 2. usePlatformTickets: super-admin קורא וממיין את כל הפניות (RPC).

export function useSubmitTicket() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit({ orgId, authorId, subject, message }) {
    setBusy(true);
    setError('');
    const { error: err } = await supabase
      .from('support_tickets')
      .insert({ org_id: orgId, author_id: authorId, subject, message });
    setBusy(false);
    if (err) {
      setError(err.message);
      return false;
    }
    return true;
  }

  return { submit, busy, error, setError };
}

export function usePlatformTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase.rpc('platform_list_tickets');
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setTickets(data ?? []);
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function setStatus(ticketId, status) {
    await supabase.rpc('platform_set_ticket_status', {
      p_id: ticketId,
      p_status: status,
    });
    await fetch();
  }

  return { tickets, loading, error, setStatus, refetch: fetch };
}
