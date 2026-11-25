type Cell = string | number | null | undefined;

const esc = (v: Cell) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Builds a CSV (with BOM so Excel reads ₹ and Indian names correctly) and downloads it. */
export function downloadCsv(filename: string, head: string[], rows: Cell[][]) {
  const text = [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
