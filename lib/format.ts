import clsx, { type ClassValue } from 'clsx';

export const cn = (...a: ClassValue[]) => clsx(a);

const inrFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
});
export const inr = (n?: number | string | null) => inrFmt.format(Number(n || 0));

/** Backend sends DATE columns as plain 'YYYY-MM-DD'; parse as a local date so it never shifts a day. */
function parseDate(s: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
}

export const fmtDate = (s?: string | null) =>
  s ? parseDate(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** 'YYYY-MM' -> 'Nov 26' */
export const fmtMonth = (s: string) =>
  parseDate(`${s}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

/** Local calendar date as 'YYYY-MM-DD' (toISOString would use UTC and can be off by a day in IST). */
export function isoDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const today = () => isoDate(new Date());

export const titleCase = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/** Form value -> API value: '' / undefined become null so Postgres accepts them. */
export const orNull = <T,>(v: T | '' | undefined | null): T | null =>
  v === '' || v === undefined || v === null ? null : v;

/** Form value -> number or null. */
export const numOrNull = (v: string | number | null | undefined): number | null =>
  v === '' || v === undefined || v === null ? null : Number(v);

/** ₹12.4L / ₹1.2Cr / ₹48K style for tight spaces (axes, chips). */
export function inrCompact(n?: number | string | null) {
  const v = Number(n || 0), a = Math.abs(v), s = v < 0 ? '-' : '';
  if (a >= 1e7) return `${s}₹${+(a / 1e7).toFixed(2)}Cr`;
  if (a >= 1e5) return `${s}₹${+(a / 1e5).toFixed(1)}L`;
  if (a >= 1e3) return `${s}₹${+(a / 1e3).toFixed(1)}K`;
  return `${s}₹${Math.round(a)}`;
}

/** Whole days from `a` to `b` (both 'YYYY-MM-DD'). */
export function daysBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86400000);
}
export const daysFromToday = (s: string) => daysBetween(today(), s);
export const addDays = (s: string, n: number) => { const d = parseDate(s); d.setDate(d.getDate() + n); return isoDate(d); };

/** "in 12 days" / "3 days ago" / "today" */
export function relDays(s: string) {
  const d = daysFromToday(s);
  if (d === 0) return 'today';
  if (d === 1) return 'tomorrow';
  if (d === -1) return 'yesterday';
  return d > 0 ? `in ${d} days` : `${-d} days ago`;
}

export const initials = (s: string) =>
  s.replace(/^E2E-/, '').split(/[\s-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';

export const pct = (part: number, whole: number) => (whole > 0 ? Math.max(0, Math.min(100, (part / whole) * 100)) : 0);

/** API value -> form value (null becomes ''). */
export const str = (v: string | number | null | undefined) => (v === null || v === undefined ? '' : String(v));
