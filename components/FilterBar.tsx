'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import { Bus, Building2, Calendar, X } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { fmtDate } from '@/lib/format';
import { periodRange, type Period } from '@/lib/periods';
import type { Vehicle, Company } from '@/lib/types';
import Segmented from '@/components/ui/Segmented';
import Dropdown from '@/components/ui/Dropdown';

export interface Filters { from?: string; to?: string; vehicle_id?: string; company_id?: string; status?: string; }

/** The filters FilterBar starts with ("this month"). Pages use this as their initial state. */
export const defaultFilters = (): Filters => periodRange('this_month');

interface State {
  period: Period; from: string; to: string;
  vehicle: string; company: string; status: string;
}
const INITIAL: State = { period: 'this_month', from: '', to: '', vehicle: '', company: '', status: '' };

function toFilters(s: State, showStatus: boolean): Filters {
  const range = s.period === 'custom'
    ? { from: s.from || undefined, to: s.to || undefined }
    : periodRange(s.period);
  return {
    ...range,
    vehicle_id: s.vehicle || undefined,
    company_id: s.company || undefined,
    status: showStatus ? s.status || undefined : undefined,
  };
}

/** Short label on phones so all five fit in one row; full label from `sm` up. */
const lbl = (short: string, full: string) => (
  <><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{full}</span></>
);
const PERIODS: { value: Period; label: React.ReactNode }[] = [
  { value: 'this_month', label: lbl('Month', 'This month') }, { value: 'last_month', label: lbl('Last', 'Last month') },
  { value: 'this_year', label: lbl('Year', 'This year') }, { value: 'all', label: lbl('All', 'All time') }, { value: 'custom', label: 'Custom' },
];

export default function FilterBar({ onChange, showStatus = false, periodOnly = false }: {
  onChange: (f: Filters) => void; showStatus?: boolean; periodOnly?: boolean;
}) {
  const { data: vehicles } = useSWR<Vehicle[]>('/vehicles', fetcher);
  const { data: companies } = useSWR<Company[]>('/companies', fetcher);
  const [s, setS] = useState<State>(INITIAL);

  // Emit from the handler (not an effect) so the parent fetches once per change.
  const update = (patch: Partial<State>) => {
    const next = { ...s, ...patch };
    setS(next);
    onChange(toFilters(next, showStatus));
  };

  const range = s.period === 'custom' ? null : periodRange(s.period);
  const chips = [
    s.vehicle && { key: 'vehicle', label: vehicles?.find((v) => String(v.id) === s.vehicle)?.number },
    s.company && { key: 'company', label: companies?.find((c) => String(c.id) === s.company)?.name },
    showStatus && s.status && { key: 'status', label: s.status[0].toUpperCase() + s.status.slice(1) },
  ].filter(Boolean) as { key: 'vehicle' | 'company' | 'status'; label?: string }[];

  return (
    <div className="card mb-6 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented value={s.period} onChange={(p) => update({ period: p })} options={PERIODS} className="w-full sm:w-auto" full fullOnPhoneOnly />
        {range?.from && (
          <span className="hidden items-center gap-1.5 text-xs text-zinc-400 md:flex">
            <Calendar size={13} /> {fmtDate(range.from)} – {fmtDate(range.to)}
          </span>
        )}
      </div>

      <AnimatePresence initial={false}>
        {s.period === 'custom' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="grid grid-cols-2 gap-3 pt-3 sm:flex sm:flex-wrap sm:items-end">
              <div className="min-w-0"><label className="label">From</label>
                <input type="date" className="input h-10 py-0 sm:h-9 sm:w-44" value={s.from} max={s.to || undefined} onChange={(e) => update({ from: e.target.value })} /></div>
              <div className="min-w-0"><label className="label">To</label>
                <input type="date" className="input h-10 py-0 sm:h-9 sm:w-44" value={s.to} min={s.from || undefined} onChange={(e) => update({ to: e.target.value })} /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!periodOnly && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 sm:flex sm:flex-wrap sm:items-center">
          <Dropdown label="Vehicle" icon={<Bus size={14} />} value={s.vehicle} onChange={(v) => update({ vehicle: v })}
            options={(vehicles ?? []).map((v) => ({ value: String(v.id), label: v.number, hint: v.is_active ? undefined : 'inactive' }))} />
          <Dropdown label="Company" icon={<Building2 size={14} />} value={s.company} onChange={(v) => update({ company: v })}
            options={(companies ?? []).map((c) => ({ value: String(c.id), label: c.name, hint: c.is_active ? undefined : 'inactive' }))} />
          {showStatus && (
            <Dropdown label="Status" value={s.status} onChange={(v) => update({ status: v })}
              options={['scheduled', 'running', 'completed', 'cancelled'].map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }))} />
          )}
          <AnimatePresence>
            {chips.length > 0 && (
              <motion.button type="button" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                onClick={() => update({ vehicle: '', company: '', status: '' })}
                className="col-span-2 flex h-10 items-center justify-center gap-1 rounded-xl px-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 sm:ml-auto sm:h-9 sm:justify-start">
                <X size={14} /> Clear filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
