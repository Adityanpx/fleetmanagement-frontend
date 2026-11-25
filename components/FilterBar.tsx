'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Select } from '@/components/ui/Select';
import { periodRange, type Period } from '@/lib/periods';
import type { Vehicle, Driver, Company } from '@/lib/types';

export interface Filters { from?: string; to?: string; vehicle_id?: string; driver_id?: string; company_id?: string; status?: string; }

/** The filters FilterBar starts with ("this month"). Pages use this as their initial state. */
export const defaultFilters = (): Filters => periodRange('this_month');

interface State {
  period: Period; from: string; to: string;
  vehicle: string; driver: string; company: string; status: string;
}

function toFilters(s: State, showStatus: boolean): Filters {
  const range = s.period === 'custom'
    ? { from: s.from || undefined, to: s.to || undefined }
    : periodRange(s.period);
  return {
    ...range,
    vehicle_id: s.vehicle || undefined,
    driver_id: s.driver || undefined,
    company_id: s.company || undefined,
    status: showStatus ? s.status || undefined : undefined,
  };
}

export default function FilterBar({ onChange, showStatus = false }: {
  onChange: (f: Filters) => void; showStatus?: boolean;
}) {
  const { data: vehicles } = useSWR<Vehicle[]>('/vehicles', fetcher);
  const { data: drivers } = useSWR<Driver[]>('/drivers', fetcher);
  const { data: companies } = useSWR<Company[]>('/companies', fetcher);

  const [s, setS] = useState<State>({
    period: 'this_month', from: '', to: '', vehicle: '', driver: '', company: '', status: '',
  });

  // Emit from the handler (not an effect) so the parent fetches once per change.
  const update = (patch: Partial<State>) => {
    const next = { ...s, ...patch };
    setS(next);
    onChange(toFilters(next, showStatus));
  };

  return (
    <div className="card mb-5 grid grid-cols-2 gap-3 p-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="col-span-2 sm:col-span-1">
        <label className="label">Period</label>
        <Select value={s.period} onChange={(e) => update({ period: e.target.value as Period })} className="sm:w-40">
          <option value="this_month">This month</option>
          <option value="last_month">Last month</option>
          <option value="this_year">This year</option>
          <option value="all">All time</option>
          <option value="custom">Custom</option>
        </Select>
      </div>
      {s.period === 'custom' && (
        <>
          <div><label className="label">From</label>
            <input type="date" className="input sm:w-40" value={s.from} onChange={(e) => update({ from: e.target.value })} /></div>
          <div><label className="label">To</label>
            <input type="date" className="input sm:w-40" value={s.to} onChange={(e) => update({ to: e.target.value })} /></div>
        </>
      )}
      <div><label className="label">Vehicle</label>
        <Select value={s.vehicle} onChange={(e) => update({ vehicle: e.target.value })} className="sm:w-40">
          <option value="">All</option>
          {vehicles?.map((v) => <option key={v.id} value={v.id}>{v.number}</option>)}
        </Select></div>
      <div><label className="label">Driver</label>
        <Select value={s.driver} onChange={(e) => update({ driver: e.target.value })} className="sm:w-40">
          <option value="">All</option>
          {drivers?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </Select></div>
      <div><label className="label">Company</label>
        <Select value={s.company} onChange={(e) => update({ company: e.target.value })} className="sm:w-40">
          <option value="">All</option>
          {companies?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select></div>
      {showStatus && (
        <div><label className="label">Status</label>
          <Select value={s.status} onChange={(e) => update({ status: e.target.value })} className="sm:w-40">
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select></div>
      )}
    </div>
  );
}
