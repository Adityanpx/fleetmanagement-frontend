'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, cn } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import type { Trip, Status } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';

const tabs: (Status | 'all')[] = ['all', 'scheduled', 'running', 'completed', 'cancelled'];

export default function TripsPage() {
  const [tab, setTab] = useState<Status | 'all'>('all');
  const query = toQuery({ status: tab === 'all' ? undefined : tab });
  const { data: trips, error, isLoading, mutate } = useSWR<Trip[]>(`/trips${query}`, fetcher);

  return (
    <>
      <PageHeader title="Trips" subtitle="All trips and their money"
        action={<Link href="/trips/new" className="btn-primary"><Plus size={16} /> New trip</Link>} />

      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map((t) => (
          <button type="button" key={t} onClick={() => setTab(t)}
            className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition',
              tab === t ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100')}>{t}</button>
        ))}
      </div>

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <Spinner /> : !trips || trips.length === 0 ? (
        tab === 'all'
          ? <EmptyState title="No trips yet" hint="Create your first trip to start tracking costs and profit." />
          : <EmptyState title={`No ${tab} trips`} />
      ) : (
        <div className="space-y-2">
          {trips.map((t) => (
            <Link key={t.id} href={`/trips/${t.id}`} className="card block p-4 transition hover:border-zinc-300">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{t.vehicle_number}</span>
                    <Badge status={t.status} />
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">{t.start_location} → {t.actual_end_location || t.expected_end_location || '—'}</p>
                  <p className="mt-0.5 text-xs text-zinc-400">{fmtDate(t.start_date)} · {t.company_name || 'No company'} · {t.driver_name || 'No driver'}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('font-semibold tabular-nums', Number(t.profit) >= 0 ? 'text-emerald-600' : 'text-red-600')}>{inr(t.profit)}</p>
                  <p className="text-xs text-zinc-400">profit</p>
                  {Number(t.pending) > 0 && <p className="mt-0.5 text-xs text-red-500">{inr(t.pending)} pending</p>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
