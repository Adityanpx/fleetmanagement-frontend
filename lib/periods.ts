import { isoDate } from './format';

export type Period = 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom';

export function periodRange(p: Period): { from?: string; to?: string } {
  const now = new Date();
  if (p === 'this_month')
    return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
             to: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)) };
  if (p === 'last_month')
    return { from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
             to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)) };
  if (p === 'this_year')
    return { from: isoDate(new Date(now.getFullYear(), 0, 1)),
             to: isoDate(new Date(now.getFullYear(), 11, 31)) };
  return {}; // 'all' / 'custom' handled by caller
}

export function toQuery(obj: object) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
}
