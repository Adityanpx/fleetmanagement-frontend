import {
  Fuel, HandCoins, Ticket, Utensils, Gavel, SquareParking, PackageOpen, CircleDot, Wrench, Ellipsis,
  type LucideIcon,
} from 'lucide-react';
import type { Category, Status } from './types';

/** Validated categorical order (see globals.css). Assigned by entity, never by rank. */
export const SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'] as const;
export const OTHER = '#a1a1aa';
export const INCOME = SERIES[0];
export const COST = SERIES[1];
export const POSITIVE = '#059669'; // emerald-600: profit
export const NEGATIVE = '#dc2626'; // red-600: loss / dues
export const GRID = '#f1f1f3';
export const AXIS = '#a1a1aa';

export const CATEGORY: Record<Category, { label: string; icon: LucideIcon; tint: string }> = {
  diesel: { label: 'Diesel', icon: Fuel, tint: 'bg-blue-50 text-blue-600' },
  advance: { label: 'Advance', icon: HandCoins, tint: 'bg-violet-50 text-violet-600' },
  toll: { label: 'Toll', icon: Ticket, tint: 'bg-orange-50 text-orange-600' },
  food: { label: 'Food / batta', icon: Utensils, tint: 'bg-amber-50 text-amber-600' },
  fine: { label: 'Fine', icon: Gavel, tint: 'bg-red-50 text-red-600' },
  parking: { label: 'Parking', icon: SquareParking, tint: 'bg-sky-50 text-sky-600' },
  loading_unloading: { label: 'Loading', icon: PackageOpen, tint: 'bg-teal-50 text-teal-600' },
  tyre: { label: 'Tyre', icon: CircleDot, tint: 'bg-zinc-100 text-zinc-700' },
  repair: { label: 'Repair', icon: Wrench, tint: 'bg-pink-50 text-pink-600' },
  other: { label: 'Other', icon: Ellipsis, tint: 'bg-zinc-100 text-zinc-500' },
};

/** Fixed color per category (identity follows the entity, not its rank). Past 7 slots -> gray. */
const CATEGORY_ORDER: Category[] = ['diesel', 'toll', 'repair', 'food', 'tyre', 'loading_unloading', 'parking', 'fine', 'other', 'advance'];
export const categoryColor = (c: Category) => {
  const i = CATEGORY_ORDER.indexOf(c);
  return i >= 0 && i < SERIES.length ? SERIES[i] : OTHER;
};

export const STATUS_META: Record<Status, { label: string; color: string; dot: string; pill: string }> = {
  scheduled: { label: 'Scheduled', color: '#a1a1aa', dot: 'bg-zinc-400', pill: 'bg-zinc-100 text-zinc-700 ring-zinc-200' },
  running: { label: 'Running', color: '#2a78d6', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700 ring-blue-200' },
  completed: { label: 'Completed', color: '#059669', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  cancelled: { label: 'Cancelled', color: '#dc2626', dot: 'bg-red-500', pill: 'bg-red-50 text-red-700 ring-red-200' },
};

/** Soft avatar tints (decorative, not data). */
const AVATAR = [
  'bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800',
  'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700', 'bg-teal-100 text-teal-700',
];
export const avatarTint = (seed: string | number) => {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR[h % AVATAR.length];
};
