'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, cn } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';

type Tab = 'trips' | 'vehicles' | 'fuel' | 'drivers' | 'companies';
const TABS: { key: Tab; label: string }[] = [
  { key: 'trips', label: 'Trips' }, { key: 'vehicles', label: 'Vehicles' },
  { key: 'fuel', label: 'Fuel' }, { key: 'drivers', label: 'Drivers' },
  { key: 'companies', label: 'Companies' },
];

type Num = number;
interface TripRow { id: number; start_date: string; vehicle: string; company: string | null; income: Num; owner_cost: Num; profit: Num; pending: Num }
interface VehicleRow { id: number; number: string; brand: string; trips: Num; income: Num; owner_cost: Num; profit: Num; km: Num }
interface FuelRow { id: number; number: string; litres: Num; diesel_cost: Num; km: Num; km_per_litre: Num | null; cost_per_km: Num | null }
interface DriverRow { id: number; name: string; advances: Num; own_spend: Num; net_settle: Num; balance: Num }
interface CompanyRow { id: number; name: string; trips: Num; freight: Num; diesel_given: Num; received: Num; pending: Num }
interface Report<R> { rows: R[]; totals?: { income: Num; owner_cost: Num; profit: Num; pending: Num } }

const n = (v: Num | null | undefined) => (v == null ? '—' : Number(v).toLocaleString('en-IN'));
const sum = <R,>(rows: R[], k: keyof R) => rows.reduce((s, r) => s + Number(r[k] || 0), 0);

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('trips');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  // Status only applies to the trips report; drop it elsewhere so it can't silently filter other tabs.
  const q = toQuery(tab === 'trips' ? filters : { ...filters, status: undefined });
  const { data, error, isLoading, mutate } = useSWR<Report<unknown>>(`/reports/${tab}${q}`, fetcher);

  return (
    <>
      <PageHeader title="Reports" subtitle="Filter by period, vehicle, driver or company" />
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button type="button" key={t.key} onClick={() => setTab(t.key)}
            className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition',
              tab === t.key ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100')}>{t.label}</button>
        ))}
      </div>
      <FilterBar onChange={setFilters} showStatus={tab === 'trips'} />
      {tab === 'drivers' && <p className="-mt-2 mb-3 text-xs text-zinc-400">Driver balances are all-time; filters don&apos;t apply.</p>}
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data ? <Spinner /> : (
        <div className="card overflow-x-auto">
          {tab === 'trips' && (() => {
            const d = data as Report<TripRow>;
            return <Table head={['Date', 'Vehicle', 'Company', 'Income', 'Cost', 'Profit', 'Pending']} numericFrom={3}
              rows={d.rows.map((r) => [fmtDate(r.start_date), r.vehicle, r.company || '—', inr(r.income), inr(r.owner_cost), <Money key="p" v={r.profit} />, inr(r.pending)])}
              foot={d.totals && d.rows.length > 0 && ['Total', '', '', inr(d.totals.income), inr(d.totals.owner_cost), <Money key="p" v={d.totals.profit} />, inr(d.totals.pending)]} />;
          })()}
          {tab === 'vehicles' && (() => {
            const rows = (data as Report<VehicleRow>).rows;
            return <Table head={['Vehicle', 'Trips', 'Income', 'Cost', 'Profit', 'Km']} numericFrom={1}
              rows={rows.map((r) => [`${r.number} · ${r.brand}`, n(r.trips), inr(r.income), inr(r.owner_cost), <Money key="p" v={r.profit} />, n(r.km)])}
              foot={rows.length > 0 && ['Total', n(sum(rows, 'trips')), inr(sum(rows, 'income')), inr(sum(rows, 'owner_cost')), <Money key="p" v={sum(rows, 'profit')} />, n(sum(rows, 'km'))]} />;
          })()}
          {tab === 'fuel' && (() => {
            const rows = (data as Report<FuelRow>).rows;
            return <Table head={['Vehicle', 'Litres', 'Diesel cost', 'Km', 'Km/L', '₹/km']} numericFrom={1}
              rows={rows.map((r) => [r.number, n(r.litres), inr(r.diesel_cost), n(r.km), n(r.km_per_litre), r.cost_per_km == null ? '—' : `₹${r.cost_per_km}`])}
              foot={rows.length > 0 && ['Total', n(sum(rows, 'litres')), inr(sum(rows, 'diesel_cost')), n(sum(rows, 'km')), '', '']} />;
          })()}
          {tab === 'drivers' && (() => {
            const rows = (data as Report<DriverRow>).rows;
            return <Table head={['Driver', 'Advances', 'Own spend', 'Settled', 'Balance']} numericFrom={1}
              rows={rows.map((r) => [r.name, inr(r.advances), inr(r.own_spend), inr(r.net_settle),
                <span key="b" className={Number(r.balance) > 0 ? 'text-emerald-600' : Number(r.balance) < 0 ? 'text-red-600' : 'text-zinc-400'}>
                  {Number(r.balance) > 0 ? `We owe ${inr(r.balance)}` : Number(r.balance) < 0 ? `Owes ${inr(-r.balance)}` : 'Settled'}</span>])} />;
          })()}
          {tab === 'companies' && (() => {
            const rows = (data as Report<CompanyRow>).rows;
            return <Table head={['Company', 'Trips', 'Freight', 'Diesel given', 'Received', 'Pending']} numericFrom={1}
              rows={rows.map((r) => [r.name, n(r.trips), inr(r.freight), inr(r.diesel_given), inr(r.received),
                <span key="p" className={Number(r.pending) > 0 ? 'text-red-600' : ''}>{inr(r.pending)}</span>])}
              foot={rows.length > 0 && ['Total', n(sum(rows, 'trips')), inr(sum(rows, 'freight')), inr(sum(rows, 'diesel_given')), inr(sum(rows, 'received')), inr(sum(rows, 'pending'))]} />;
          })()}
        </div>
      )}
    </>
  );
}

function Money({ v }: { v: number }) {
  return <span className={Number(v) >= 0 ? 'text-emerald-600' : 'text-red-600'}>{inr(v)}</span>;
}

type CellValue = React.ReactNode;

/** Columns from `numericFrom` onwards are right-aligned figures. */
function Table({ head, rows, foot, numericFrom = Infinity }: {
  head: string[]; rows: CellValue[][]; foot?: CellValue[] | false; numericFrom?: number;
}) {
  const align = (j: number) => (j >= numericFrom ? 'text-right' : 'text-left');
  return (
    <table className="w-full text-sm">
      <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
        <tr>{head.map((h, j) => <th key={h} className={cn('whitespace-nowrap px-4 py-2', align(j))}>{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {rows.length === 0 ? <tr><td className="px-4 py-8 text-center text-zinc-400" colSpan={head.length}>No data</td></tr> :
          rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={cn('whitespace-nowrap px-4 py-2 tabular-nums', align(j))}>{c}</td>)}</tr>)}
      </tbody>
      {foot && <tfoot><tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
        {foot.map((c, j) => <td key={j} className={cn('whitespace-nowrap px-4 py-2 tabular-nums', align(j))}>{c}</td>)}</tr></tfoot>}
    </table>
  );
}
