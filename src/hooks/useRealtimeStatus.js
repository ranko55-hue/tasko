import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// מצב חיבור ה-Realtime, גלובלי לכל המסכים.
// המחוון עבר לשורת התדריך שמלווה כל מסך, ולכן הוא לא יכול להישען יותר על
// useDashboard שקיים רק בלוח. כאן נפתח ערוץ קל שמדווח על מצב החיבור בלבד.
export function useRealtimeStatus(orgId) {
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`presence-${orgId}`)
      .subscribe((status) => {
        setLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId]);

  return live;
}
