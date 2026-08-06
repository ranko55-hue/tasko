import { useMemo } from 'react';
import { taskSpan, isOverrun, taskTooltip, pct, STATUS_BLOCK, MEETING_BLOCK } from '../../lib/timeline';
import { weekDays, hhmm } from '../../lib/calendar';
import { he } from '../../locales/he';

const t = he.calendar;
const LANE_H = 34;
const NOW = () => new Date();

// אריזת בלוקים ל"מסלולים" כדי שחופפים בזמן לא ידרסו זה את זה.
function pack(items) {
  const laneEnds = [];
  const placed = items
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((it) => {
      let lane = laneEnds.findIndex((end) => end <= it.start);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(it.end); }
      else laneEnds[lane] = it.end;
      return { ...it, lane };
    });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

// ציר-זמן (גאנט) — שורות = חברי צוות (+ "ללא שיוך"), ציר אופקי = זמן.
// dir=ltr פנימי כדי שהזמן יזרום שמאל→ימין; עמודת השמות דביקה משמאל.
export default function TimelineView({ members, tasks, meetings, rangeStart, rangeEnd, scale, onTask, onMeeting }) {
  const now = NOW();
  const nowPct = now >= rangeStart && now <= rangeEnd ? pct(now, rangeStart, rangeEnd) : null;

  const ticks = useMemo(() => {
    if (scale === 'week') {
      return weekDays(rangeStart).map((d) => ({
        left: pct(d, rangeStart, rangeEnd),
        label: `${t.weekdaysShort[d.getDay()]} ${d.getDate()}`,
      }));
    }
    const out = [];
    for (let h = 0; h <= 24; h += 3) {
      const d = new Date(rangeStart.getTime() + h * 3600000);
      out.push({ left: pct(d, rangeStart, rangeEnd), label: `${String(h).padStart(2, '0')}:00` });
    }
    return out;
  }, [scale, rangeStart, rangeEnd]);

  // בניית שורות: "ללא שיוך" ראשונה, אחר כך חברי הצוות.
  const rows = useMemo(() => {
    const byAssignee = {};
    const unassigned = [];
    for (const task of tasks) {
      const it = { kind: 'task', task, ...taskSpan(task) };
      if (task.assignee_id) (byAssignee[task.assignee_id] ||= []).push(it);
      else unassigned.push(it);
    }
    const meetByMember = {};
    const meetUnassigned = [];
    for (const occ of meetings) {
      const it = { kind: 'meeting', occ, start: occ.start, end: occ.end };
      const owner = occ.meeting.created_by;
      if (owner && members.some((m) => m.id === owner)) (meetByMember[owner] ||= []).push(it);
      else meetUnassigned.push(it);
    }
    const result = [{ key: 'none', label: t.unassigned, items: [...unassigned, ...meetUnassigned] }];
    for (const m of members) {
      result.push({ key: m.id, label: m.full_name, items: [...(byAssignee[m.id] || []), ...(meetByMember[m.id] || [])] });
    }
    return result;
  }, [members, tasks, meetings]);

  return (
    <div dir="ltr" className="overflow-x-auto rounded-lg border border-drLine bg-white">
      <div className="min-w-[760px]">
        {/* ציר עליון */}
        <div className="flex border-b border-drLine bg-surface">
          <div className="sticky left-0 z-20 w-28 shrink-0 bg-surface" />
          <div className="relative h-8 flex-1">
            {ticks.map((tk, i) => (
              <span key={i} className="absolute top-1.5 -translate-x-1/2 text-[11px] font-bold text-grayMid" style={{ left: `${tk.left}%` }}>
                {tk.label}
              </span>
            ))}
          </div>
        </div>

        {/* שורות */}
        {rows.map((row) => {
          const { placed, lanes } = pack(row.items);
          const h = lanes * LANE_H + 8;
          return (
            <div key={row.key} className="flex border-b border-drLine last:border-b-0">
              <div className="sticky left-0 z-10 flex w-28 shrink-0 items-center bg-white px-2 text-sm font-bold text-navy" dir="rtl">
                <span className="truncate">{row.label}</span>
              </div>
              <div className="relative flex-1" style={{ height: h }}>
                {nowPct !== null && (
                  <div className="absolute inset-y-0 z-0 w-px bg-statusRed/70" style={{ left: `${nowPct}%` }} aria-hidden="true" />
                )}
                {placed.map((it, i) => {
                  const l = pct(it.start, rangeStart, rangeEnd);
                  const r = pct(it.end, rangeStart, rangeEnd);
                  const top = it.lane * LANE_H + 4;
                  if (it.kind === 'task') {
                    const over = isOverrun(it.task, now);
                    const nP = pct(now, rangeStart, rangeEnd);
                    return (
                      <div key={i}>
                        {over && nP > r && (
                          <div className="absolute z-0 rounded-r-md bg-statusRed/80" style={{ left: `${r}%`, width: `${nP - r}%`, top, height: LANE_H - 8 }} aria-hidden="true" />
                        )}
                        <button
                          type="button"
                          onClick={() => onTask(it.task)}
                          title={taskTooltip(it.task)}
                          className={`absolute z-10 overflow-hidden rounded-md px-1.5 text-[11px] font-bold ${STATUS_BLOCK[it.task.status] || STATUS_BLOCK.pending}`}
                          style={{ left: `${l}%`, width: `${Math.max(1.5, r - l)}%`, top, height: LANE_H - 8, lineHeight: `${LANE_H - 8}px` }}
                        >
                          <span className="block truncate">{it.task.title}</span>
                        </button>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onMeeting(it.occ)}
                      title={`${it.occ.meeting.title} · ${hhmm(it.start)}`}
                      className={`absolute z-10 overflow-hidden rounded-md px-1.5 text-[11px] font-bold ${MEETING_BLOCK}`}
                      style={{ left: `${l}%`, width: `${Math.max(1.5, r - l)}%`, top, height: LANE_H - 8, lineHeight: `${LANE_H - 8}px` }}
                    >
                      <span className="block truncate">{it.occ.meeting.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
