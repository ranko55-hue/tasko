import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ymd, eachDate, isWorkday } from '../lib/attendance';

const COLS = 'id, member_id, date, type, note, attachment_path, start_time, end_time, hours, reported_by';

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
      start_time: extra.start_time ?? null,
      end_time: extra.end_time ?? null,
      hours: extra.hours ?? null,
      reported_by: extra.reported_by ?? null,
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

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [{ data: mem }, { data: ent }] = await Promise.all([
      supabase.from('org_members').select('id, full_name').eq('org_id', orgId).eq('is_active', true).order('full_name'),
      supabase.from('attendance_entries').select(COLS).eq('org_id', orgId).gte('date', from).lte('date', to),
    ]);
    setMembers(mem ?? []);
    setEntries(ent ?? []);
    setLoading(false);
  }, [orgId, from, to]);

  useEffect(() => { load(); }, [load]);

  const today = ymd();
  const workdays = eachDate(from, to < today ? to : today).filter(isWorkday);

  const rows = members.map((m) => {
    const es = entries.filter((e) => e.member_id === m.id);
    const counts = { work: 0, vacation: 0, sick: 0 };
    const reported = new Set();
    let workHours = 0;
    es.forEach((e) => {
      counts[e.type] += 1;
      reported.add(e.date);
      if (e.type === 'work') workHours += Number(e.hours || 0);
    });
    const unreported = workdays.filter((d) => !reported.has(d)).length;
    return { member: m, ...counts, workHours: Math.round(workHours * 100) / 100, unreported };
  });

  const entriesByMember = {};
  entries.forEach((e) => { (entriesByMember[e.member_id] ||= {})[e.date] = e; });

  return { rows, entriesByMember, members, entries, loading, refetch: load };
}

// פירוט יומי של עובד בודד לטווח (מסך /attendance, לשונית נוכחות, תיקון מנהל).
export function useMemberAttendance(orgId, memberId, from, to) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orgId || !memberId) return;
    setLoading(true);
    const { data } = await supabase.from('attendance_entries').select(COLS)
      .eq('member_id', memberId).gte('date', from).lte('date', to)
      .order('date', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, [orgId, memberId, from, to]);

  useEffect(() => { load(); }, [load]);

  return { entries, loading, refetch: load };
}
