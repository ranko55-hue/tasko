// ייצוא דוחות — CSV והדפסה נקייה. משמש את דוח הנוכחות (שני ההיקפים).

function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// חלון הדפסה נקי — טבלה בלבד, כמו סיכום ההדפסה של משימה סגורה.
export function printReport(title, headers, rows) {
  const w = window.open('', '_blank');
  if (!w) return;
  const th = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const trs = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  w.document.write(
    `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"><title>${esc(title)}</title>` +
    '<style>body{font-family:Arial,sans-serif;color:#0f2a43;padding:24px}h1{font-size:18px;margin:0 0 12px}' +
    'table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;text-align:right;font-size:13px}' +
    'th{background:#f4f6f8}</style></head><body>' +
    `<h1>${esc(title)}</h1><table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>` +
    '<script>window.onload=function(){window.print()}<\/script></body></html>',
  );
  w.document.close();
}
