'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { fetcher } from '@/lib/api';
import { inr, titleCase, fmtDate, fmtMonth, today, isoDate } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import type { DashboardData } from '@/lib/types';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import StatTile from '@/components/ui/StatTile';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import PageHeader from '@/components/ui/PageHeader';

const DOCS = [
  ['insurance_expiry', 'Insurance'], ['fitness_expiry', 'Fitness'],
  ['permit_expiry', 'Permit'], ['puc_expiry', 'PUC'],
] as const;

const compact = (v: number) =>
  Math.abs(v) >= 100000 ? `${(v / 100000).toFixed(1)}L` : Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(`/dashboard${toQuery(filters)}`, fetcher, { keepPreviousData: true });

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your fleet at a glance" />
      <FilterBar onChange={setFilters} />
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data ? <Spinner /> : (
        <div className="space-y-6">
          {/* Tiles */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile label="Profit" value={inr(data.tiles.total_profit)}
              tone={Number(data.tiles.total_profit) >= 0 ? 'positive' : 'negative'} />
            <StatTile label="Income" value={inr(data.tiles.total_income)} />
            <StatTile label="Total cost" value={inr(data.tiles.total_cost)} />
            <StatTile label="Diesel cost" value={inr(data.tiles.diesel_cost)} />
            <StatTile label="Pending to receive" value={inr(data.tiles.total_pending)}
              tone={Number(data.tiles.total_pending) > 0 ? 'negative' : 'default'} />
            <StatTile label="Running trips" value={String(data.tiles.running_trips)}
              hint={`${data.tiles.total_trips} trips in period`} />
          </div>

          {/* Monthly trend */}
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">Monthly profit</h3>
            {data.monthly.length === 0 ? <p className="text-sm text-zinc-400">No trips in this period.</p> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly} margin={{ left: -12, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                    <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={compact} />
                    <Tooltip cursor={{ fill: '#f4f4f5' }} labelFormatter={(l) => fmtMonth(String(l))}
                      formatter={(v) => [inr(Number(v)), 'Profit']} />
                    <Bar dataKey="profit" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {data.monthly.map((m) => <Cell key={m.month} fill={m.profit >= 0 ? '#18181b' : '#dc2626'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Category + Vehicle bars */}
          <div className="grid gap-6 lg:grid-cols-2">
            <BarList title="Expenses by category"
              rows={data.expensesByCategory.map((r) => ({ label: titleCase(r.category), value: Number(r.total) }))} />
            <BarList title="Profit by vehicle"
              rows={data.profitByVehicle.map((r) => ({ label: r.number, value: Number(r.profit) }))} />
          </div>

          {/* Running trips */}
          <div className="card p-4">
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">Running now</h3>
            {data.runningTrips.length === 0 ? <p className="text-sm text-zinc-400">No trips running.</p> : (
              <ul className="-mx-2 divide-y divide-zinc-100">
                {data.runningTrips.map((t) => (
                  <li key={t.id}>
                    <Link href={`/trips/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-sm hover:bg-zinc-50">
                      <div className="min-w-0">
                        <p className="font-medium">{t.vehicle_number}</p>
                        <p className="truncate text-xs text-zinc-500">{t.start_location} → {t.expected_end_location || '—'}{t.company_name ? ` · ${t.company_name}` : ''}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tabular-nums text-zinc-700">{inr(t.owner_cost)}</p>
                        <p className="text-xs text-zinc-400">spent so far</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Alerts + driver dues */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">Documents expiring (30 days)</h3>
              {data.documentExpiries.length === 0 ? <p className="text-sm text-zinc-400">Nothing due soon.</p> : (
                <ul className="space-y-3 text-sm">
                  {data.documentExpiries.map((v) => (
                    <li key={v.id}>
                      <p className="font-medium">{v.number}</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {DOCS.filter(([k]) => v[k] && v[k]! <= addDays(30)).map(([k, label]) => {
                          const expired = v[k]! < today();
                          return (
                            <li key={k} className="flex justify-between text-xs">
                              <span className="text-zinc-500">{label}</span>
                              <span className={expired ? 'font-medium text-red-600' : 'text-amber-600'}>
                                {expired ? 'Expired' : 'Expires'} {fmtDate(v[k])}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-zinc-700">Driver balances</h3>
              {data.driverDues.length === 0 ? <p className="text-sm text-zinc-400">All settled.</p> : (
                <ul className="space-y-1.5 text-sm">
                  {data.driverDues.map((d) => (
                    <li key={d.id} className="flex justify-between gap-3"><span>{d.name}</span>
                      <span className={`tabular-nums ${Number(d.balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {Number(d.balance) >= 0 ? `We owe ${inr(d.balance)}` : `Owes us ${inr(-d.balance)}`}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function BarList({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-zinc-400">No data.</p> : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate text-zinc-600" title={r.label}>{r.label}</span>
              <div className="h-2 flex-1 rounded-full bg-zinc-100">
                <div className={`h-2 rounded-full ${r.value < 0 ? 'bg-red-500' : 'bg-zinc-900'}`}
                  style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} />
              </div>
              <span className={`w-24 shrink-0 text-right tabular-nums ${r.value < 0 ? 'text-red-600' : 'text-zinc-600'}`}>{inr(r.value)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
