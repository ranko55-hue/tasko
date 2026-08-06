import { taskSpan, pct, isOverrun } from './src/lib/timeline.js';
const rs = new Date('2026-08-03T00:00:00'), re = new Date('2026-08-10T00:00:00'); // a week
// task Mon 08:00 → Tue 16:00 (due_at)
const task = { starts_on:'2026-08-03', start_time:'08:00:00', due_at:'2026-08-04T16:00:00', status:'in_progress', assignee_id:'x' };
const s = taskSpan(task);
console.log('span:', s.start.toISOString(), '→', s.end.toISOString());
console.log('left%:', pct(s.start, rs, re).toFixed(1), 'right%:', pct(s.end, rs, re).toFixed(1));
// overrun: due in the past, still open
const late = { starts_on:'2026-08-03', start_time:'08:00:00', due_at:'2026-08-03T10:00:00', status:'in_progress', assignee_id:'x' };
console.log('overrun(open,past-due):', isOverrun(late, new Date('2026-08-05T12:00:00')));
console.log('overrun(done):', isOverrun({...late, status:'done'}, new Date('2026-08-05T12:00:00')));
// fallback: no dates → uses created_at, end=+1h
const nod = { created_at:'2026-08-05T09:00:00', status:'pending' };
const s2 = taskSpan(nod); console.log('fallback dur(min):', (s2.end-s2.start)/60000);
