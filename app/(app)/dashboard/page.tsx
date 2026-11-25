'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'motion/react';
import {
  TrendingUp, IndianRupee, Wallet, Hourglass, Fuel, Truck, Percent, ArrowRight, ShieldCheck, CalendarClock, Plus,
} from 'lucide-react';
import { fetcher } from '@/lib/api';
import { inr, inrCompact, fmtDate, daysFromToday, daysBetween, today, pct, cn } from '@/lib/format';
import { previousRange, toQuery } from '@/lib/periods';
import { CATEGORY, categoryColor, STATUS_META, POSITIVE, NEGATIVE, INCOME, COST } from '@/lib/meta';
import type { DashboardData, Trip, Status } from '@/lib/types';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import StatTile from '@/components/ui/StatTile';
import ErrorState from '@/components/ui/ErrorState';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import { SkeletonStats, SkeletonChart } from '@/components/ui/Skeleton';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import ChartCard from '@/components/charts/ChartCard';
import TrendChart from '@/components/charts/TrendChart';
import SegmentedBar from '@/components/charts/SegmentedBar';
import HBars from '@/components/charts/HBars';

const DOCS = [
  ['insurance_expiry', 'Insurance'], ['fitness_expiry', 'Fitness'],
  ['permit_expiry', 'Permit'], ['puc_expiry', 'PUC'],
] as const;

interface CompanyRow { id: number; name: string; pending: number; trips: number }

const delta = (cur: number, prev?: number) =>
  prev === undefined || prev === 0 ? null : (cur - prev) / Math.abs(prev);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const q = toQuery(filters);
  const prev = previousRange(filters.from, filters.to);
  const opts = { keepPreviousData: true };

  const { data, error, isLoading, mutate } = useSWR<DashboardData>(`/dashboard${q}`, fetcher, opts);
  const { data: before } = useSWR<DashboardData>(prev ? `/dashboard${toQuery({ ...filters, ...prev })}` : null, fetcher, opts);
  const { data: trips } = useSWR<Trip[]>(`/trips${q}`, fetcher, opts);
  const { data: running } = useSWR<Trip[]>('/trips?status=running', fetcher);
  const { data: companies } = useSWR<{ rows: CompanyRow[] }>(`/reports/companies${q}`, fetcher, opts);

  const t = data?.tiles;
  const p = before?.tiles;
  const income = Number(t?.total_income ?? 0);
  const profit = Number(t?.total_profit ?? 0);
  const months = data?.monthly ?? [];
  const spark = (k: 'income' | 'cost' | 'profit') => (months.length > 1 ? months.map((m) => Number(m[k])) : undefined);
  // Fewer than two months in range -> plot by day from the period's trips instead.
  const daily = Object.values((trips ?? []).reduce<Record<string, { month: string; income: number; cost: number; profit: number }>>((acc, tr) => {
    const k = tr.start_date;
    acc[k] ??= { month: k, income: 0, cost: 0, profit: 0 };
    acc[k].income += Number(tr.income || 0); acc[k].cost += Number(tr.owner_cost || 0); acc[k].profit += Number(tr.profit || 0);
    return acc;
  }, {})).sort((a, b) => a.month.localeCompare(b.month));
  const byDay = months.length < 2;
  const margin = income > 0 ? profit / income : 0;
  const prevMargin = p && Number(p.total_income) > 0 ? Number(p.total_profit) / Number(p.total_income) : undefined;

  return (
    <>
      <PageHeader eyebrow={greeting()} title="Fleet overview" subtitle="Money, trips and alerts across your fleet"
        action={<Link href="/trips/new" className="btn-primary"><Plus size={16} /> New trip</Link>} />
      <FilterBar onChange={setFilters} />

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data || !t ? (
        <div className="space-y-6"><SkeletonStats /><div className="grid gap-6 lg:grid-cols-3"><SkeletonChart className="lg:col-span-2" /><SkeletonChart /></div></div>
      ) : (
        <div className="space-y-6">
          {/* KPIs */}
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StaggerItem><StatTile label="Net profit" value={profit} format={inr} icon={TrendingUp}
              iconTint={profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}
              tone={profit >= 0 ? 'positive' : 'negative'} delta={delta(profit, p && Number(p.total_profit))}
              hint={prev ? 'vs prev.' : undefined} trend={spark('profit')} trendColor={profit >= 0 ? POSITIVE : NEGATIVE} /></StaggerItem>
            <StaggerItem><StatTile label="Income" value={income} format={inr} icon={IndianRupee} iconTint="bg-blue-50 text-blue-600"
              delta={delta(income, p && Number(p.total_income))} hint={prev ? 'vs prev.' : undefined} trend={spark('income')} trendColor={INCOME} /></StaggerItem>
            <StaggerItem><StatTile label="Total cost" value={Number(t.total_cost)} format={inr} icon={Wallet} iconTint="bg-orange-50 text-orange-600"
              delta={delta(Number(t.total_cost), p && Number(p.total_cost))} upIsGood={false} hint={prev ? 'vs prev.' : undefined}
              trend={spark('cost')} trendColor={COST} /></StaggerItem>
            <StaggerItem><StatTile label="Pending to receive" value={Number(t.total_pending)} format={inr} icon={Hourglass}
              iconTint="bg-amber-50 text-amber-600" tone={Number(t.total_pending) > 0 ? 'negative' : 'default'}
              delta={delta(Number(t.total_pending), p && Number(p.total_pending))} upIsGood={false} hint={prev ? 'vs prev.' : undefined} /></StaggerItem>
          </Stagger>

          {/* Secondary strip */}
          <Stagger className="grid grid-cols-3 gap-3">
            <MiniStat icon={Truck} label="Trips" value={String(t.total_trips)} sub={`${t.running_trips} running`} />
            <MiniStat icon={Fuel} label="Diesel (own)" value={inrCompact(t.diesel_cost)} sub={income > 0 ? `${pct(Number(t.diesel_cost), income).toFixed(0)}% of income` : '—'} />
            <MiniStat icon={Percent} label="Margin" value={income > 0 ? `${(margin * 100).toFixed(1)}%` : '—'}
              sub={prevMargin !== undefined ? `${((margin - prevMargin) * 100 >= 0 ? '+' : '')}${((margin - prevMargin) * 100).toFixed(1)} pts` : 'profit ÷ income'}
              tone={income > 0 ? (margin >= 0 ? 'pos' : 'neg') : undefined} />
          </Stagger>

          {/* Trend + status mix */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard className="lg:col-span-2" title="Income vs cost" subtitle={`${byDay ? 'By trip start date' : 'Per month'} · hover for profit`}>
              {(byDay ? daily : months).length === 0 ? <Empty text="No trips in this period." />
                : <TrendChart data={byDay ? daily : months} xFormat={byDay ? (s) => fmtDate(s).slice(0, 6) : undefined} />}
            </ChartCard>
            <ChartCard title="Trip status" subtitle={`${trips?.length ?? 0} trips in period`}>
              <StatusMix trips={trips ?? []} />
            </ChartCard>
          </div>

          {/* Expense breakdown + profit by vehicle */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Where the money goes" subtitle="Owner-paid expenses by category (advances excluded)">
              <SegmentedBar thick segments={data.expensesByCategory.map((r) => {
                const Icon = CATEGORY[r.category].icon;
                return { key: r.category, label: CATEGORY[r.category].label, value: Number(r.total), color: categoryColor(r.category),
                  icon: <Icon size={14} className="text-zinc-400" /> };
              })} />
            </ChartCard>
            <ChartCard title="Profit by vehicle" subtitle="Ranked, losses in red">
              <HBars signed rows={data.profitByVehicle.map((r) => ({ key: r.id, label: r.number, sub: r.brand, value: Number(r.profit) }))} />
            </ChartCard>
          </div>

          {/* Running now + pending by company */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Running now" subtitle="Live trips, progress against expected end date"
              action={<Link href="/trips" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">All trips <ArrowRight size={13} /></Link>}>
              <RunningList trips={running ?? []} />
            </ChartCard>
            <ChartCard title="Waiting to be paid" subtitle="Pending freight by company">
              <HBars color="#f59e0b" limit={6} empty="Nothing pending. 🎉"
                rows={(companies?.rows ?? []).filter((c) => Number(c.pending) > 0)
                  .map((c) => ({ key: c.id, label: c.name, sub: `${c.trips} trips`, value: Number(c.pending) }))} />
            </ChartCard>
          </div>

          {/* Alerts + driver dues */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Document alerts" subtitle="Expired or expiring in 30 days">
              <ExpiryList vehicles={data.documentExpiries} />
            </ChartCard>
            <ChartCard title="Driver balances" subtitle="Advances vs money they spent for us"
              action={<Link href="/drivers" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">Settle <ArrowRight size={13} /></Link>}>
              {data.driverDues.length === 0 ? <Empty text="All drivers are settled." icon={<ShieldCheck size={18} />} /> : (
                <ul className="space-y-1">
                  {data.driverDues.map((d) => {
                    const bal = Number(d.balance);
                    return (
                      <li key={d.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-50">
                        <Avatar name={d.name} seed={d.id} size="sm" />
                        <span className="flex-1 truncate text-sm font-medium">{d.name}</span>
                        <span className={cn('chip tabular-nums', bal >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                          {bal >= 0 ? `We owe ${inr(bal)}` : `Owes us ${inr(-bal)}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}

function MiniStat({ icon: Icon, label, value, sub, tone }: {
  icon: typeof Truck; label: string; value: string; sub?: string; tone?: 'pos' | 'neg';
}) {
  return (
    <StaggerItem className="card flex items-center gap-3 p-3 sm:p-4">
      <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500 sm:grid"><Icon size={17} /></span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className={cn('text-base font-semibold tabular-nums sm:text-lg', tone === 'pos' && 'text-emerald-600', tone === 'neg' && 'text-red-600')}>{value}</p>
        {sub && <p className="truncate text-[11px] text-zinc-400">{sub}</p>}
      </div>
    </StaggerItem>
  );
}

function Empty({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return <div className="flex flex-col items-center gap-2 py-8 text-sm text-zinc-400">{icon}{text}</div>;
}

function StatusMix({ trips }: { trips: Trip[] }) {
  const order: Status[] = ['running', 'scheduled', 'completed', 'cancelled'];
  const counts = order.map((s) => ({ s, n: trips.filter((t) => t.status === s).length }));
  if (trips.length === 0) return <Empty text="No trips in this period." />;
  return (
    <div>
      <SegmentedBar thick legend="inline" format={(n) => String(n)}
        segments={counts.map(({ s, n }) => ({ key: s, label: STATUS_META[s].label, value: n, color: STATUS_META[s].color }))} />
      <div className="mt-5 grid grid-cols-2 gap-2">
        {counts.map(({ s, n }) => (
          <div key={s} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3">
            <p className="flex items-center gap-1.5 text-xs text-zinc-500"><span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} />{STATUS_META[s].label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunningList({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) return <Empty text="No trips on the road right now." icon={<Truck size={18} />} />;
  const now = today();
  return (
    <ul className="-mx-2 space-y-1">
      {trips.map((t, i) => {
        const total = t.expected_end_date ? Math.max(1, daysBetween(t.start_date, t.expected_end_date)) : 0;
        const elapsed = Math.max(0, daysBetween(t.start_date, now));
        const overdue = !!t.expected_end_date && now > t.expected_end_date;
        const progress = total ? pct(elapsed, total) : 0;
        return (
          <motion.li key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={`/trips/${t.id}`} className="block rounded-xl px-2 py-2.5 transition-colors hover:bg-zinc-50">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping-slow rounded-full bg-blue-500" /><span className="relative h-2 w-2 rounded-full bg-blue-500" /></span>
                  {t.vehicle_number}
                </span>
                <span className="tabular-nums text-zinc-500">{inr(t.owner_cost)} <span className="text-xs text-zinc-400">spent</span></span>
              </div>
              <p className="mt-0.5 truncate pl-4 text-xs text-zinc-500">{t.start_location} → {t.expected_end_location || '—'}{t.driver_name ? ` · ${t.driver_name}` : ''}</p>
              <div className="mt-2 flex items-center gap-3 pl-4">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                  <motion.div className={cn('h-full rounded-full', overdue ? 'bg-red-500' : 'bg-blue-500')}
                    initial={{ width: 0 }} animate={{ width: total ? `${progress}%` : '35%' }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
                </div>
                <span className={cn('w-24 shrink-0 text-right text-[11px]', overdue ? 'font-medium text-red-600' : 'text-zinc-400')}>
                  {!total ? `Day ${elapsed + 1}` : overdue ? `${daysBetween(t.expected_end_date!, now)}d overdue` : `Day ${Math.min(elapsed + 1, total)} of ${total}`}
                </span>
              </div>
            </Link>
          </motion.li>
        );
      })}
    </ul>
  );
}

function ExpiryList({ vehicles }: { vehicles: DashboardData['documentExpiries'] }) {
  const items = vehicles.flatMap((v) => DOCS
    .filter(([k]) => v[k] && daysFromToday(v[k]!) <= 30)
    .map(([k, label]) => ({ id: `${v.id}-${k}`, vehicle: v.number, label, date: v[k]!, days: daysFromToday(v[k]!) })))
    .sort((a, b) => a.days - b.days);
  if (items.length === 0) return <Empty text="All papers are valid." icon={<ShieldCheck size={18} className="text-emerald-500" />} />;
  return (
    <ul className="space-y-1">
      {items.map((d) => (
        <li key={d.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-50">
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl', d.days < 0 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
            <CalendarClock size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.vehicle} <span className="font-normal text-zinc-500">· {d.label}</span></p>
            <p className="text-xs text-zinc-400">{fmtDate(d.date)}</p>
          </div>
          <span className={cn('chip', d.days < 0 ? 'bg-red-50 text-red-700' : d.days <= 7 ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-700')}>
            {d.days < 0 ? `Expired ${-d.days}d ago` : d.days === 0 ? 'Expires today' : `${d.days} days left`}
          </span>
        </li>
      ))}
    </ul>
  );
}
