'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Truck, Bus, Fuel, Building2 } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, cn } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import { downloadCsv } from '@/lib/csv';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import Segmented from '@/components/ui/Segmented';
import { SkeletonChart } from '@/components/ui/Skeleton';
import ChartCard from '@/components/charts/ChartCard';
import ProfitBars from '@/components/charts/ProfitBars';
import HBars from '@/components/charts/HBars';

type Tab = 'trips' | 'vehicles' | 'fuel' | 'companies';
const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'trips', label: 'Trips', icon: <Truck size={14} /> }, { value: 'vehicles', label: 'Vehicles', icon: <Bus size={14} /> },
  { value: 'fuel', label: 'Fuel', icon: <Fuel size={14} /> }, { value: 'companies', label: 'Companies', icon: <Building2 size={14} /> },
];

type Num = number;
interface TripRow { id: number; start_date: string; status: string; vehicle: string; company: string | null; freight_amount: Num; company_diesel: Num; income: Num; owner_cost: Num; profit: Num; received: Num; pending: Num; km: Num | null }
interface VehicleRow { id: number; number: string; brand: string; trips: Num; income: Num; owner_cost: Num; profit: Num; km: Num }
interface FuelRow { id: number; number: string; brand: string; litres: Num; diesel_cost: Num; km: Num; km_per_litre: Num | null; cost_per_km: Num | null }
interface CompanyRow { id: number; name: string; trips: Num; freight: Num; diesel_given: Num; income: Num; received: Num; pending: Num }
interface Report<R> { rows: R[]; totals?: { income: Num; owner_cost: Num; profit: Num; pending: Num } }

const n = (v: Num | null | undefined, digits = 0) => (v == null ? '—' : Number(v).toLocaleString('en-IN', { maximumFractionDigits: digits }));
const sum = <R,>(rows: R[], k: keyof R) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

interface Col<R> { h: string; v: (r: R) => React.ReactNode; csv: (r: R) => string | number; num?: boolean; foot?: React.ReactNode }

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('trips');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  // Status only applies to the trips report; drop it elsewhere so it can't silently filter other tabs.
  const q = toQuery(tab === 'trips' ? filters : { ...filters, status: undefined });
  const { data, error, isLoading, mutate } = useSWR<Report<unknown>>(`/reports/${tab}${q}`, fetcher);

  return (
    <>
      <PageHeader title="Reports" subtitle="Drill into trips, vehicles, fuel and companies" />
      <Segmented value={tab} onChange={setTab} options={TABS} className="mb-4" />
      <FilterBar onChange={setFilters} showStatus={tab === 'trips'} />

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data ? <SkeletonChart /> : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
            {tab === 'trips' && <TripsReport d={data as Report<TripRow>} />}
            {tab === 'vehicles' && <VehiclesReport rows={(data as Report<VehicleRow>).rows} />}
            {tab === 'fuel' && <FuelReport rows={(data as Report<FuelRow>).rows} />}
            {tab === 'companies' && <CompaniesReport rows={(data as Report<CompanyRow>).rows} />}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}

const Money = ({ v }: { v: Num }) => <span className={Number(v) >= 0 ? 'text-emerald-600' : 'text-red-600'}>{inr(v)}</span>;

function TripsReport({ d }: { d: Report<TripRow> }) {
  const chart = [...d.rows].reverse().slice(-31).map((r) => ({ label: `${fmtDate(r.start_date).slice(0, 6)} · ${r.vehicle}`, profit: Number(r.profit) }));
  const t = d.totals;
  return (
    <Layout
      summary={t && [['Income', inr(t.income)], ['Cost', inr(t.owner_cost)], ['Profit', <Money key="p" v={t.profit} />], ['Pending', inr(t.pending)]]}
      chart={<ChartCard title="Profit per trip" subtitle={d.rows.length > 31 ? 'Latest 31 trips' : `${d.rows.length} trips`}>
        {chart.length ? <ProfitBars data={chart} xKey="label" xFormat={(s) => s.split(' · ')[0]} /> : <Nothing />}
      </ChartCard>}
      file="trips-report.csv" rows={d.rows}
      cols={[
        { h: 'Date', v: (r) => fmtDate(r.start_date), csv: (r) => r.start_date, foot: 'Total' },
        { h: 'Vehicle', v: (r) => <b className="font-medium">{r.vehicle}</b>, csv: (r) => r.vehicle },
        { h: 'Company', v: (r) => r.company || '—', csv: (r) => r.company ?? '' },
        { h: 'Status', v: (r) => <span className="capitalize text-zinc-500">{r.status}</span>, csv: (r) => r.status },
        { h: 'Income', v: (r) => inr(r.income), csv: (r) => r.income, num: true, foot: t && inr(t.income) },
        { h: 'Cost', v: (r) => inr(r.owner_cost), csv: (r) => r.owner_cost, num: true, foot: t && inr(t.owner_cost) },
        { h: 'Profit', v: (r) => <Money v={r.profit} />, csv: (r) => r.profit, num: true, foot: t && <Money v={t.profit} /> },
        { h: 'Pending', v: (r) => <span className={Number(r.pending) > 0 ? 'text-amber-600' : ''}>{inr(r.pending)}</span>, csv: (r) => r.pending, num: true, foot: t && inr(t.pending) },
      ]} />
  );
}

function VehiclesReport({ rows }: { rows: VehicleRow[] }) {
  return (
    <Layout
      summary={[['Trips', n(sum(rows, 'trips'))], ['Income', inr(sum(rows, 'income'))], ['Profit', <Money key="p" v={sum(rows, 'profit')} />], ['Km', n(sum(rows, 'km'))]]}
      chart={<ChartCard title="Profit by vehicle" subtitle="Ranked">
        <HBars signed rows={rows.map((r) => ({ key: r.id, label: r.number, sub: r.brand, value: Number(r.profit) }))} />
      </ChartCard>}
      file="vehicles-report.csv" rows={rows}
      cols={[
        { h: 'Vehicle', v: (r) => <><b className="font-medium">{r.number}</b> <span className="text-zinc-400">{r.brand}</span></>, csv: (r) => r.number, foot: 'Total' },
        { h: 'Trips', v: (r) => n(r.trips), csv: (r) => r.trips, num: true, foot: n(sum(rows, 'trips')) },
        { h: 'Income', v: (r) => inr(r.income), csv: (r) => r.income, num: true, foot: inr(sum(rows, 'income')) },
        { h: 'Cost', v: (r) => inr(r.owner_cost), csv: (r) => r.owner_cost, num: true, foot: inr(sum(rows, 'owner_cost')) },
        { h: 'Profit', v: (r) => <Money v={r.profit} />, csv: (r) => r.profit, num: true, foot: <Money v={sum(rows, 'profit')} /> },
        { h: 'Km', v: (r) => n(r.km), csv: (r) => r.km, num: true, foot: n(sum(rows, 'km')) },
      ]} />
  );
}

function FuelReport({ rows }: { rows: FuelRow[] }) {
  const litres = sum(rows, 'litres'), km = sum(rows, 'km'), cost = sum(rows, 'diesel_cost');
  return (
    <Layout
      summary={[['Litres', n(litres)], ['Own diesel cost', inr(cost)], ['Fleet km/L', litres > 0 ? n(km / litres, 2) : '—'], ['Fleet ₹/km', km > 0 ? `₹${n(cost / km, 2)}` : '—']]}
      chart={<ChartCard title="Mileage by vehicle" subtitle="Kilometres per litre (higher is better)">
        <HBars color="#2a78d6" format={(v) => `${n(v, 2)} km/L`}
          rows={rows.filter((r) => r.km_per_litre != null).sort((a, b) => Number(b.km_per_litre) - Number(a.km_per_litre))
            .map((r) => ({ key: r.id, label: r.number, sub: r.brand, value: Number(r.km_per_litre) }))}
          empty="Complete trips with odometer readings and diesel litres to see mileage." />
      </ChartCard>}
      file="fuel-report.csv" rows={rows}
      cols={[
        { h: 'Vehicle', v: (r) => <b className="font-medium">{r.number}</b>, csv: (r) => r.number, foot: 'Total' },
        { h: 'Litres', v: (r) => n(r.litres, 1), csv: (r) => r.litres, num: true, foot: n(litres, 1) },
        { h: 'Diesel cost', v: (r) => inr(r.diesel_cost), csv: (r) => r.diesel_cost, num: true, foot: inr(cost) },
        { h: 'Km', v: (r) => n(r.km), csv: (r) => r.km, num: true, foot: n(km) },
        { h: 'Km/L', v: (r) => n(r.km_per_litre, 2), csv: (r) => r.km_per_litre ?? '', num: true },
        { h: '₹/km', v: (r) => (r.cost_per_km == null ? '—' : `₹${n(r.cost_per_km, 2)}`), csv: (r) => r.cost_per_km ?? '', num: true },
      ]} />
  );
}

function CompaniesReport({ rows }: { rows: CompanyRow[] }) {
  return (
    <Layout
      summary={[['Freight', inr(sum(rows, 'freight'))], ['Diesel given', inr(sum(rows, 'diesel_given'))], ['Received', inr(sum(rows, 'received'))], ['Pending', inr(sum(rows, 'pending'))]]}
      chart={<ChartCard title="Pending by company" subtitle="Who still owes freight">
        <HBars color="#f59e0b" rows={rows.filter((r) => Number(r.pending) > 0).map((r) => ({ key: r.id, label: r.name, sub: `${r.trips} trips`, value: Number(r.pending) }))}
          empty="Nothing pending." />
      </ChartCard>}
      file="companies-report.csv" rows={rows}
      cols={[
        { h: 'Company', v: (r) => <b className="font-medium">{r.name}</b>, csv: (r) => r.name, foot: 'Total' },
        { h: 'Trips', v: (r) => n(r.trips), csv: (r) => r.trips, num: true, foot: n(sum(rows, 'trips')) },
        { h: 'Freight', v: (r) => inr(r.freight), csv: (r) => r.freight, num: true, foot: inr(sum(rows, 'freight')) },
        { h: 'Diesel given', v: (r) => inr(r.diesel_given), csv: (r) => r.diesel_given, num: true, foot: inr(sum(rows, 'diesel_given')) },
        { h: 'Received', v: (r) => inr(r.received), csv: (r) => r.received, num: true, foot: inr(sum(rows, 'received')) },
        { h: 'Pending', v: (r) => <span className={Number(r.pending) > 0 ? 'text-amber-600' : ''}>{inr(r.pending)}</span>, csv: (r) => r.pending, num: true, foot: inr(sum(rows, 'pending')) },
      ]} />
  );
}

function Nothing() { return <p className="py-10 text-center text-sm text-zinc-400">No data for this period.</p>; }

function Layout<R>({ summary, chart, rows, cols, file }: {
  summary?: [string, React.ReactNode][] | false | undefined; chart: React.ReactNode; rows: R[]; cols: Col<R>[]; file: string;
}) {
  const hasFoot = rows.length > 0 && cols.some((c) => c.foot !== undefined);
  return (
    <div className="space-y-6">
      {summary && (
        <div className={cn('grid gap-3', summary.length === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4')}>
          {summary.map(([label, value], i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
            </motion.div>
          ))}
        </div>
      )}
      {chart}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <p className="card-title">Details <span className="font-normal text-zinc-400">· {rows.length} rows</span></p>
          {rows.length > 0 && (
            <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs"
              onClick={() => downloadCsv(file, cols.map((c) => c.h), rows.map((r) => cols.map((c) => c.csv(r))))}>
              <Download size={14} /> CSV
            </button>
          )}
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="table-base">
            <thead><tr>{cols.map((c) => <th key={c.h} className={cn('whitespace-nowrap', c.num ? 'text-right' : 'text-left')}>{c.h}</th>)}</tr></thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.length === 0 ? <tr><td colSpan={cols.length} className="py-10 text-center text-zinc-400">No data</td></tr> :
                rows.map((r, i) => (
                  <tr key={i}>{cols.map((c) => <td key={c.h} className={cn('whitespace-nowrap tabular-nums', c.num && 'text-right')}>{c.v(r)}</td>)}</tr>
                ))}
            </tbody>
            {hasFoot && (
              <tfoot><tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                {cols.map((c) => <td key={c.h} className={cn('whitespace-nowrap px-4 py-3 tabular-nums', c.num && 'text-right')}>{c.foot ?? ''}</td>)}
              </tr></tfoot>
            )}
          </table>
        </div>
      </section>
    </div>
  );
}
