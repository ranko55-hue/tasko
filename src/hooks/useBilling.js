import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// מצב חיוב הארגון לכל חבר (RPC security-definer) — לנעילה ולתצוגה.
export function useBilling() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('org_billing_status');
    setStatus(data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 120000);
    // חזרה מדף התשלום — ה-webhook כבר עדכן; רענון בהשהיות + ניקוי הכתובת
    // (מונע white-screen/רה-טריגר ברענון).
    const p = new URLSearchParams(window.location.search).get('billing');
    let timers = [];
    if (p) {
      timers = [1200, 3500, 7000].map((ms) => setTimeout(load, ms));
      const url = new URL(window.location.href);
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    return () => { clearInterval(id); timers.forEach(clearTimeout); };
  }, [load]);

  const locked = !!status?.known && !!status?.locked;
  return { status, locked, loading, reload: load };
}

// פרטי חיוב מלאים — אדמין בלבד (RLS).
export function useBillingDetails(orgId, isAdmin) {
  const [sub, setSub] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAdmin || !orgId) { setLoading(false); return; }
    const [{ data: s }, { data: inv }] = await Promise.all([
      supabase.from('subscriptions').select('*').eq('org_id', orgId).maybeSingle(),
      supabase.from('billing_invoices').select('*').eq('org_id', orgId).order('charged_at', { ascending: false }),
    ]);
    setSub(s ?? null);
    setInvoices(inv ?? []);
    setLoading(false);
  }, [orgId, isAdmin]);

  useEffect(() => { load(); }, [load]);
  return { sub, invoices, loading, reload: load };
}

async function invokeRedirect(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, body ? { body } : {});
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (data?.url) window.location.href = data.url;
  return data;
}

export const startCheckout = () => invokeRedirect('billing-create-payment');
export const startReplaceCard = () => invokeRedirect('billing-replace-card');
export const cancelSubscription = (action) => invokeRedirect('billing-cancel', { action });
