import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ymd, eachDate, isWorkday } from '../lib/attendance';

const COLS = 'id, member_id, date, type, note, attachment_path';

// דיווח עצמי של העובד — הרשומות של 8 הימים האחרונים + upsert.
export function useMyAttendance(orgId, memberId) {
  const [byDate, setByDate] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId || !memberId) return;
    setLoading(true);
    const from = ymd(new Date(Date.now() - 8 * 86400000));
    const { data } = await supabase
      .from('attendance_entries')
      .select(COLS)
      .eq('member_id', memberId)
      .gte('date', from);
    const map = {};
    (data ?? []).forEach((e) => { map[e.date] = e; });
    setByDate(map);
    setLoading(false);
  }, [orgId, memberId]);

  useEffect(() => { load(); }, [load]);

  async function report(date, type, extra = {}) {
    const row = {
      org_id: orgId, member_id: memberId, date, type,
      note: extra.note ?? null,
      attachment_path: extra.attachment_path ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('attendance_entries')
      .upsert(row, { onConflict: 'org_id,member_id,date' })
      .select(COLS).single();
    if (error) throw error;
    setByDate((m) => ({ ...m, [date]: data }));
    return data;
  }

  return { byDate, loading, report, reload: load };
}

// דוח נוכחות למנהל — כל העובדים × טווח, עם סיכומים לשורה.
export function useAttendanceReport(orgId, from, to) {
  const [members, setMembers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const [{ data: mem }, { data: ent }] = await Promise.all([
        supabase.from('org_members').select('id, full_name').eq('org_id', orgId).eq('is_active', true).order('full_name'),
        supabase.from('attendance_entries').select(COLS).eq('org_id', orgId).gte('date', from).lte('date', to),
      ]);
      if (!alive) return;
      setMembers(mem ?? []);
      setEntries(ent ?? []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [orgId, from, to]);

  const today = ymd();
  const workdays = eachDate(from, to < today ? to : today).filter(isWorkday);

  const rows = members.map((m) => {
    const es = entries.filter((e) => e.member_id === m.id);
    const counts = { work: 0, vacation: 0, sick: 0 };
    const reported = new Set();
    es.forEach((e) => { counts[e.type] += 1; reported.add(e.date); });
    const unreported = workdays.filter((d) => !reported.has(d)).length;
    return { member: m, ...counts, unreported };
  });

  const entriesByMember = {};
  entries.forEach((e) => { (entriesByMember[e.member_id] ||= {})[e.date] = e; });

  return { rows, entriesByMember, members, entries, loading };
}

// פירוט יומי של עובד בודד לטווח (לשונית נוכחות בכרטיס העובד).
export function useMemberAttendance(orgId, memberId, from, to) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId || !memberId) return;
    let alive = true;
    setLoading(true);
    supabase.from('attendance_entries').select(COLS)
      .eq('member_id', memberId).gte('date', from).lte('date', to)
      .order('date', { ascending: false })
      .then(({ data }) => { if (alive) { setEntries(data ?? []); setLoading(false); } });
    return () => { alive = false; };
  }, [orgId, memberId, from, to]);

  return { entries, loading };
}
