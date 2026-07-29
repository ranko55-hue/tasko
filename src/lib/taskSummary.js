import { he } from '../locales/he';
import { formatDateTime } from './time';
import { describeEdit } from './taskEdits';
import { usedMinutes, allocatedMinutes, overrunMinutes } from './taskTime';

// סיכום משימה סגורה להדפסה/PDF.
//
// ההפקה נעשית דרך חלון הדפסה של הדפדפן ולא דרך ספריית PDF: עברית היא שפת
// RTL עם צורות אותיות, וספריות PDF בצד לקוח דורשות הטמעת גופן מלא ועדיין
// שוברות ניקוד וסדר תווים. הדפדפן כבר יודע לעצב עברית נכון, ו"שמירה כ-PDF"
// בתיבת ההדפסה מפיקה קובץ תקין בלי תלות נוספת ובלי 500KB של גופן בבאנדל.

const t = he.tasks;
const d = t.drawer;
const m = he.media;

function esc(v) {
  return String(v ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])
  );
}

function eventLine(ev) {
  if (ev.type === 'edited') return describeEdit(ev.payload).join('; ');
  if (ev.payload?.text) return ev.payload.text;
  return '';
}

export function buildSummaryHtml(task, events, assigneeName) {
  const est = allocatedMinutes(task);
  const over = overrunMinutes(task);

  const rows = [
    [d.chipAllocated, est ? `${est} ${he.time.minutes}` : he.common.none],
    [d.summaryUsed, `${usedMinutes(task)} ${he.time.minutes}`],
    over > 0 ? [d.overLabel, `${over} ${he.time.minutes}`] : null,
    [t.client, task.client?.name ?? he.common.none],
    [t.project, task.project?.name ?? t.noProject],
    [t.assignee, assigneeName ?? t.unassigned],
    [t.dueAt, task.due_at ? formatDateTime(task.due_at) : he.common.none],
    [t.address, task.address ?? he.common.none],
  ].filter(Boolean);

  const timeline = events
    .map((ev) => {
      const label = m.eventTypes[ev.type] ?? ev.type;
      const line = eventLine(ev);
      const who = ev.actor?.full_name ? ` · ${esc(ev.actor.full_name)}` : '';
      return `<li><span class="ts">${esc(formatDateTime(ev.created_at))}${who}</span>
        <strong>${esc(label)}</strong>${line ? `<p>${esc(line)}</p>` : ''}</li>`;
    })
    .join('');

  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<title>${esc(task.title)} — ${esc(he.app.name)}</title>
<style>
  @page { margin: 18mm; }
  body { font-family: Heebo, system-ui, Arial, sans-serif; color:#0F172A; line-height:1.55; }
  h1 { font-size:19px; margin:0 0 2px; }
  .sub { color:#64748B; font-size:13px; margin-bottom:16px; }
  .status { display:inline-block; border:1px solid #E2E8F0; border-radius:999px;
            padding:2px 10px; font-size:12px; font-weight:700; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; margin-bottom:18px; font-size:13px; }
  td { border-bottom:1px solid #E2E8F0; padding:6px 0; }
  td:first-child { color:#64748B; width:34%; }
  td:last-child { font-variant-numeric: tabular-nums; }
  h2 { font-size:14px; margin:0 0 8px; }
  ol { list-style:none; padding:0; margin:0; font-size:13px; }
  li { border-bottom:1px solid #F1F5F9; padding:7px 0; }
  .ts { color:#94A3B8; font-size:11.5px; font-variant-numeric: tabular-nums;
        display:block; margin-bottom:1px; }
  p { margin:2px 0 0; }
</style></head><body>
<div class="status">${esc(t.status[task.status] ?? task.status)}</div>
<h1>${esc(task.title)} <span style="color:#94A3B8">#${esc(task.id)}</span></h1>
<div class="sub">${esc(he.app.name)} — ${esc(d.closedTitle)}</div>
<table><tbody>${rows
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`)
    .join('')}</tbody></table>
<h2>${esc(d.sectionTimeline)}</h2>
<ol>${timeline || `<li>${esc(m.timelineEmpty)}</li>`}</ol>
</body></html>`;
}

// פותח חלון הדפסה עם הסיכום. המשתמש בוחר "שמירה כ-PDF".
export function printTaskSummary(task, events, assigneeName) {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(buildSummaryHtml(task, events, assigneeName));
  w.document.close();
  w.focus();
  // ההדפסה מחכה לטעינת הגופן כדי שהעברית לא תודפס בגופן חלופי
  w.onload = () => setTimeout(() => w.print(), 200);
  return true;
}
