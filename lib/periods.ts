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

/**
 * The window right before [from, to], used for "vs previous period" deltas.
 * Whole calendar months/years step back by month/year; anything else by the same number of days.
 */
export function previousRange(from?: string, to?: string): { from: string; to: string } | null {
  if (!from || !to) return null;
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const lastOfToMonth = new Date(ty, tm, 0).getDate();
  if (fd === 1 && td === lastOfToMonth) {
    if (fm === 1 && tm === 12 && fy === ty) // whole year
      return { from: `${fy - 1}-01-01`, to: `${fy - 1}-12-31` };
    const months = (ty - fy) * 12 + (tm - fm) + 1;
    return { from: isoDate(new Date(fy, fm - 1 - months, 1)), to: isoDate(new Date(fy, fm - 1, 0)) };
  }
  const days = Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000) + 1;
  return { from: isoDate(new Date(fy, fm - 1, fd - days)), to: isoDate(new Date(fy, fm - 1, fd - 1)) };
}

export function toQuery(obj: object) {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
}
