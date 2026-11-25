'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { inr, fmtDate, titleCase } from '@/lib/format';
import { toQuery } from '@/lib/periods';
import type { Category, Expense } from '@/lib/types';
import FilterBar, { defaultFilters, type Filters } from '@/components/FilterBar';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';

interface ExpensesReport {
  rows: (Expense & { vehicle: string; start_date: string })[];
  byCategory: { category: Category; total: number; count: number }[];
}

export default function ExpensesPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { data, error, isLoading, mutate } = useSWR<ExpensesReport>(`/reports/expenses${toQuery(filters)}`, fetcher, { keepPreviousData: true });
  const total = data?.byCategory.reduce((s, c) => s + Number(c.total), 0) ?? 0;

  return (
    <>
      <PageHeader title="Expenses" subtitle="Every rupee across all trips. Add expenses from inside a trip." />
      <FilterBar onChange={setFilters} />
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading || !data ? <Spinner /> : (
        <>
          {data.byCategory.length > 0 && (
            <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.byCategory.map((c) => (
                <div key={c.category} className="card p-3">
                  <p className="text-xs text-zinc-500">{titleCase(c.category)} <span className="text-zinc-400">· {c.count}</span></p>
                  <p className="text-lg font-semibold tabular-nums">{inr(c.total)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Vehicle</th>
                  <th className="px-4 py-2">Category</th><th className="px-4 py-2">Paid by</th>
                  <th className="px-4 py-2 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">No expenses in this period.</td></tr>
                ) : data.rows.map((e) => (
                  <tr key={e.id} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-2 text-zinc-500">{fmtDate(e.expense_date)}</td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <Link href={`/trips/${e.trip_id}`} className="text-blue-600 hover:underline">{e.vehicle}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">{titleCase(e.category)}</td>
                    <td className="whitespace-nowrap px-4 py-2 capitalize text-zinc-500">{e.paid_by}</td>
                    <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{inr(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
              {data.rows.length > 0 && (
                <tfoot><tr className="border-t border-zinc-200 bg-zinc-50 font-semibold">
                  <td className="px-4 py-2" colSpan={4}>Total</td>
                  <td className="px-4 py-2 text-right tabular-nums">{inr(total)}</td>
                </tr></tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </>
  );
}
