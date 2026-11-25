'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AnimatePresence, motion } from 'motion/react';
import { Receipt, Download } from 'lucide-react';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, cn } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import { CATEGORY, categoryColor, SERIES } from '@/lib/meta';
import { downloadCsv } from '@/lib/csv';
import type { Category, Expense, PaidBy } from '@/lib/types';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import PageHeader from '@/components/ui/PageHeader';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import SearchInput from '@/components/ui/SearchInput';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { SkeletonList, SkeletonStats } from '@/components/ui/Skeleton';
import ChartCard from '@/components/charts/ChartCard';
import SegmentedBar from '@/components/charts/SegmentedBar';

type Row = Expense & { vehicle: string; start_date: string };
interface ExpensesReport { rows: Row[]; byCategory: { category: Category; total: number; count: number }[] }

const PAID_BY: { key: PaidBy; label: string; color: string }[] = [
  { key: 'ourselves', label: 'Ourselves', color: SERIES[0] },
  { key: 'company', label: 'Company', color: SERIES[1] },
  { key: 'driver', label: 'Driver', color: SERIES[2] },
];

export default function ExpensesPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [cat, setCat] = useState<Category | ''>('');
  const [q, setQ] = useState('');
  const { data, error, isLoading, mutate } = useSWR<ExpensesReport>(`/reports/expenses${toQuery(filters)}`, fetcher, { keepPreviousData: true });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.rows ?? []).filter((e) => (!cat || e.category === cat) && (!needle ||
      [e.vehicle, e.vendor_name, e.note, e.fill_location, e.work_detail, CATEGORY[e.category].label].some((x) => x?.toLowerCase().includes(needle))));
  }, [data, cat, q]);
  const total = rows.reduce((s, e) => s + Number(e.amount), 0);
  const byPaid = PAID_BY.map((p) => ({ ...p, value: rows.filter((e) => e.paid_by === p.key).reduce((s, e) => s + Number(e.amount), 0) }));

  const exportCsv = () => downloadCsv('expenses.csv',
    ['Date', 'Vehicle', 'Category', 'Paid by', 'Amount', 'Litres', 'Rate', 'Vendor', 'Note'],
    rows.map((e) => [e.expense_date, e.vehicle, CATEGORY[e.category].label, e.paid_by, e.amount, e.litres ?? '', e.rate ?? '', e.vendor_name ?? '', e.note ?? '']));

  return (
    <>
      <PageHeader title="Expenses" subtitle="Every rupee across all trips. Add new expenses from inside a trip."
        action={rows.length > 0 && <button type="button" className="btn-secondary" onClick={exportCsv}><Download size={15} /> Export CSV</button>} />
      <FilterBar onChange={setFilters} />

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data ? (
        <div className="space-y-6"><SkeletonStats count={3} /><SkeletonList /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card flex flex-col justify-between bg-linear-to-br from-zinc-900 to-zinc-800 p-5 text-white">
              <div>
                <p className="text-sm text-zinc-400">{cat ? `${CATEGORY[cat].label} total` : 'Total spent'}</p>
                <AnimatedNumber value={total} format={inr} className="mt-1 block text-3xl font-semibold tracking-tight tabular-nums" />
              </div>
              <p className="mt-6 text-sm text-zinc-400">{rows.length} entries{data.rows.length !== rows.length ? ` (of ${data.rows.length})` : ''}</p>
            </div>
            <ChartCard className="lg:col-span-2" title="By category" subtitle="All money out, including advances and company-paid">
              <SegmentedBar thick legend="inline" segments={data.byCategory.map((c) => ({
                key: c.category, label: CATEGORY[c.category].label, value: Number(c.total), color: categoryColor(c.category),
              }))} />
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-zinc-500">Who paid</p>
                <SegmentedBar legend="inline" segments={byPaid.map((p) => ({ key: p.key, label: p.label, value: p.value, color: p.color }))} />
              </div>
            </ChartCard>
          </div>

          {/* Category chips + search */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
              <CatChip active={!cat} onClick={() => setCat('')} label="All" count={data.rows.length} />
              {data.byCategory.map((c) => {
                const m = CATEGORY[c.category];
                return <CatChip key={c.category} active={cat === c.category} onClick={() => setCat(cat === c.category ? '' : c.category)}
                  label={m.label} count={Number(c.count)} icon={<m.icon size={13} />} />;
              })}
            </div>
            <SearchInput value={q} onChange={setQ} placeholder="Search vehicle, vendor, note…" className="lg:w-72" />
          </div>

          {rows.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses" hint={data.rows.length ? 'Nothing matches these filters.' : 'No expenses in this period. Add them from a trip.'} />
          ) : (
            <div className="card overflow-hidden">
              {/* Table on desktop */}
              <div className="hidden max-h-[640px] overflow-auto md:block">
                <table className="table-base">
                  <thead>
                    <tr className="text-left"><th>Date</th><th>Category</th><th>Vehicle</th><th>Details</th><th>Paid by</th><th className="text-right">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <AnimatePresence initial={false}>
                      {rows.map((e) => {
                        const m = CATEGORY[e.category];
                        return (
                          <motion.tr key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <td className="whitespace-nowrap text-zinc-500">{fmtDate(e.expense_date)}</td>
                            <td className="whitespace-nowrap">
                              <span className="flex items-center gap-2 font-medium"><span className={cn('grid h-7 w-7 place-items-center rounded-lg', m.tint)}><m.icon size={14} /></span>{m.label}</span>
                            </td>
                            <td className="whitespace-nowrap"><Link href={`/trips/${e.trip_id}`} className="font-medium text-indigo-600 hover:underline">{e.vehicle}</Link></td>
                            <td className="max-w-[240px] truncate text-zinc-500">
                              {[e.litres != null ? `${e.litres} L` : '', e.fill_location, e.work_detail, e.vendor_name, e.note].filter(Boolean).join(' · ') || '—'}
                            </td>
                            <td className="whitespace-nowrap capitalize text-zinc-500">{e.paid_by}</td>
                            <td className="whitespace-nowrap text-right font-semibold tabular-nums">{inr(e.amount)}</td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                  <tfoot><tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                    <td className="px-4 py-3" colSpan={5}>Total</td><td className="px-4 py-3 text-right tabular-nums">{inr(total)}</td>
                  </tr></tfoot>
                </table>
              </div>
              {/* List on phones */}
              <ul className="divide-y divide-zinc-100 md:hidden">
                {rows.map((e) => {
                  const m = CATEGORY[e.category];
                  return (
                    <li key={e.id}>
                      <Link href={`/trips/${e.trip_id}`} className="flex items-center gap-3 px-4 py-3 active:bg-zinc-50">
                        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', m.tint)}><m.icon size={17} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{m.label} <span className="font-normal text-zinc-400">· {e.vehicle}</span></p>
                          <p className="truncate text-xs text-zinc-400">{fmtDate(e.expense_date)} · {e.paid_by}{e.vendor_name ? ` · ${e.vendor_name}` : ''}</p>
                        </div>
                        <span className="text-sm font-semibold tabular-nums">{inr(e.amount)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function CatChip({ active, onClick, label, count, icon }: { active: boolean; onClick: () => void; label: string; count: number; icon?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95',
        active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300')}>
      {icon}{label}
      <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-white/20' : 'bg-zinc-100 text-zinc-500')}>{count}</span>
    </button>
  );
}
