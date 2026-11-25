'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Truck, Calendar, Building2, ChevronRight } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, cn } from '@/lib/format';
import type { Trip, Status } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Segmented from '@/components/ui/Segmented';
import SearchInput from '@/components/ui/SearchInput';
import { SkeletonList } from '@/components/ui/Skeleton';

type Tab = Status | 'all';
const TABS: { value: Tab; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'running', label: 'Running' }, { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
];

export default function TripsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  // One fetch; tabs and search filter locally so counts are always visible.
  const { data: trips, error, isLoading, mutate } = useSWR<Trip[]>('/trips', fetcher);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (trips ?? []).filter((t) => (tab === 'all' || t.status === tab) && (!needle ||
      [t.vehicle_number, t.start_location, t.expected_end_location, t.actual_end_location, t.company_name, t.cargo]
        .some((x) => x?.toLowerCase().includes(needle))));
  }, [trips, tab, q]);

  const count = (s: Tab) => (trips ?? []).filter((t) => s === 'all' || t.status === s).length;
  const totalProfit = shown.reduce((a, t) => a + Number(t.profit || 0), 0);
  const totalPending = shown.reduce((a, t) => a + Number(t.pending || 0), 0);

  return (
    <>
      <PageHeader title="Trips" subtitle="Every trip with its live profit and pending payment"
        action={<Link href="/trips/new" className="btn-primary"><Plus size={16} /> New trip</Link>} />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented value={tab} onChange={setTab} options={TABS.map((t) => ({ ...t, count: trips ? count(t.value) : undefined }))} />
        <SearchInput value={q} onChange={setQ} placeholder="Search vehicle, route, company…" className="sm:w-72" />
      </div>

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <SkeletonList /> : !trips || trips.length === 0 ? (
        <EmptyState icon={Truck} title="No trips yet" hint="Create your first trip to start tracking costs and profit."
          action={<Link href="/trips/new" className="btn-secondary"><Plus size={16} /> Create a trip</Link>} />
      ) : shown.length === 0 ? (
        <EmptyState title="No matching trips" hint={q ? `Nothing matches “${q}”.` : `No ${tab} trips.`} />
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between px-1 text-xs text-zinc-500">
            <span>{shown.length} trip{shown.length === 1 ? '' : 's'}</span>
            <span className="tabular-nums">
              Profit <b className={totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>{inr(totalProfit)}</b>
              {totalPending > 0 && <> · Pending <b className="text-amber-600">{inr(totalPending)}</b></>}
            </span>
          </div>
          <motion.ul layout className="space-y-2.5">
            <AnimatePresence initial={false} mode="popLayout">
              {shown.map((t, i) => (
                <motion.li key={t.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                  exit={{ opacity: 0, scale: 0.98 }}>
                  <TripCard t={t} />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </>
      )}
    </>
  );
}

function TripCard({ t }: { t: Trip }) {
  const profit = Number(t.profit || 0);
  const pending = Number(t.pending || 0);
  const income = Number(t.income || 0);
  const paidPct = income > 0 ? Math.min(100, (Number(t.received || 0) / income) * 100) : 0;
  const dest = t.actual_end_location || t.expected_end_location || '—';
  return (
    <Link href={`/trips/${t.id}`} className="card card-hover group block p-4">
      <div className="flex items-start gap-4">
        <span className={cn('hidden h-11 w-11 shrink-0 place-items-center rounded-xl sm:grid',
          t.status === 'running' ? 'bg-blue-50 text-blue-600' : t.status === 'completed' ? 'bg-emerald-50 text-emerald-600'
            : t.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-zinc-100 text-zinc-500')}>
          <Truck size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold tracking-tight">{t.vehicle_number}</span>
            <Badge status={t.status} />
            {t.cargo && <span className="chip bg-zinc-100 py-0.5 text-zinc-600">{t.cargo}</span>}
          </div>

          {/* Route */}
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
            <span className="h-2 w-2 shrink-0 rounded-full border-2 border-zinc-400" />
            <span className="truncate">{t.start_location}</span>
            <span className="relative h-px min-w-6 flex-1 bg-[repeating-linear-gradient(90deg,#d4d4d8_0_4px,transparent_4px_8px)]" />
            <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-700" />
            <span className="truncate">{dest}</span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><Calendar size={12} />{fmtDate(t.start_date)}</span>
            <span className="flex items-center gap-1"><Building2 size={12} />{t.company_name || 'No company'}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className={cn('text-base font-semibold tabular-nums', profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>{inr(profit)}</p>
            <p className="text-[11px] text-zinc-400">profit</p>
            {t.status !== 'cancelled' && income > 0 && (
              <div className="mt-1.5 w-24">
                <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
                </div>
                <p className={cn('mt-0.5 text-[11px] tabular-nums', pending > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                  {pending > 0 ? `${inr(pending)} due` : 'Fully paid'}
                </p>
              </div>
            )}
          </div>
          <ChevronRight size={18} className="text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
        </div>
      </div>
    </Link>
  );
}
