'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { api, fetcher } from '@/lib/api';
import { today, str, orNull, numOrNull } from '@/lib/format';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import type { Vehicle, Driver, Company, Trip } from '@/lib/types';

interface FormState {
  vehicle_id: string; driver_id: string; company_id: string; cargo: string; quantity: string;
  start_date: string; start_location: string; expected_end_date: string; expected_end_location: string;
  start_odometer: string; freight_amount: string; deduct_company_diesel: boolean; notes: string;
}

function fromTrip(t?: Trip): FormState {
  return {
    vehicle_id: str(t?.vehicle_id), driver_id: str(t?.driver_id), company_id: str(t?.company_id),
    cargo: str(t?.cargo), quantity: str(t?.quantity),
    start_date: t?.start_date || today(), start_location: str(t?.start_location),
    expected_end_date: str(t?.expected_end_date), expected_end_location: str(t?.expected_end_location),
    start_odometer: str(t?.start_odometer), freight_amount: str(t?.freight_amount),
    deduct_company_diesel: t?.deduct_company_diesel ?? false, notes: str(t?.notes),
  };
}

/** Inactive records are hidden from pickers, except the one already on this trip. */
const usable = <T extends { id: number; is_active: boolean }>(list: T[] | undefined, current: string) =>
  list?.filter((x) => x.is_active || String(x.id) === current);

export default function TripForm({ initial, onSaved }: { initial?: Trip; onSaved: (t: Trip) => void }) {
  const { data: vehicles } = useSWR<Vehicle[]>('/vehicles', fetcher);
  const { data: drivers } = useSWR<Driver[]>('/drivers', fetcher);
  const { data: companies } = useSWR<Company[]>('/companies', fetcher);

  const [f, setF] = useState<FormState>(() => fromTrip(initial));
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  // On a NEW trip, picking a company pre-sets the deduct switch from that company's default.
  function pickCompany(id: string) {
    const c = companies?.find((x) => String(x.id) === id);
    setF((p) => ({
      ...p, company_id: id,
      deduct_company_diesel: !initial && c ? c.deduct_diesel_default : p.deduct_company_diesel,
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Only editable fields are sent; empty optional values become null.
    const payload = {
      vehicle_id: Number(f.vehicle_id),
      driver_id: numOrNull(f.driver_id),
      company_id: numOrNull(f.company_id),
      cargo: orNull(f.cargo.trim()),
      quantity: numOrNull(f.quantity),
      start_date: f.start_date,
      start_location: f.start_location.trim(),
      expected_end_date: orNull(f.expected_end_date),
      expected_end_location: orNull(f.expected_end_location.trim()),
      start_odometer: numOrNull(f.start_odometer),
      freight_amount: Number(f.freight_amount || 0),
      deduct_company_diesel: f.deduct_company_diesel,
      notes: orNull(f.notes.trim()),
    };
    try {
      const saved = initial ? await api.put(`/trips/${initial.id}`, payload) : await api.post('/trips', payload);
      toast.success(initial ? 'Trip updated' : 'Trip created');
      onSaved(saved);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  const vehicleList = usable(vehicles, f.vehicle_id);
  const driverList = usable(drivers, f.driver_id);
  const companyList = usable(companies, f.company_id);

  return (
    <form onSubmit={submit} className="space-y-4">
      {vehicles && vehicleList?.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You need a vehicle first. <Link href="/vehicles" className="font-medium underline">Add a vehicle</Link>
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vehicle" required>
          <Select required value={f.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)}>
            <option value="">Select vehicle</option>
            {vehicleList?.map((v) => <option key={v.id} value={v.id}>{v.number} · {v.brand}</option>)}
          </Select>
        </Field>
        <Field label="Company">
          <Select value={f.company_id} onChange={(e) => pickCompany(e.target.value)}>
            <option value="">No company</option>
            {companyList?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Driver">
          <Select value={f.driver_id} onChange={(e) => set('driver_id', e.target.value)}>
            <option value="">No driver</option>
            {driverList?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Cargo / grade">
          <input className="input" value={f.cargo} onChange={(e) => set('cargo', e.target.value)} placeholder="e.g. OPC 53" />
        </Field>
        <Field label="Start date" required>
          <input type="date" className="input" required value={f.start_date} onChange={(e) => set('start_date', e.target.value)} />
        </Field>
        <Field label="Start location" required>
          <input className="input" required value={f.start_location} onChange={(e) => set('start_location', e.target.value)} placeholder="Plant / city" />
        </Field>
        <Field label="Expected end date">
          <input type="date" className="input" min={f.start_date} value={f.expected_end_date} onChange={(e) => set('expected_end_date', e.target.value)} />
        </Field>
        <Field label="Expected end location">
          <input className="input" value={f.expected_end_location} onChange={(e) => set('expected_end_location', e.target.value)} />
        </Field>
        <Field label="Start odometer (km)">
          <input type="number" inputMode="numeric" min={0} className="input" value={f.start_odometer} onChange={(e) => set('start_odometer', e.target.value)} />
        </Field>
        <Field label="Quantity (tons)">
          <input type="number" inputMode="decimal" min={0} step="any" className="input" value={f.quantity} onChange={(e) => set('quantity', e.target.value)} />
        </Field>
      </div>

      {/* Freight + deduct switch together */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <Field label="Freight amount (₹)" required>
          <input type="number" inputMode="decimal" min={0} step="any" className="input" required value={f.freight_amount} onChange={(e) => set('freight_amount', e.target.value)} />
        </Field>
        <label className="mt-3 flex items-center gap-3 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-zinc-900" checked={f.deduct_company_diesel}
            onChange={(e) => set('deduct_company_diesel', e.target.checked)} />
          <span>Deduct company-given diesel from freight</span>
        </label>
        <p className="mt-1 pl-7 text-xs text-zinc-400">On = company owes freight minus the diesel it gave. Off = diesel is free, full freight owed.</p>
      </div>

      <Field label="Notes">
        <textarea className="input min-h-[70px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      <div className="flex justify-end">
        <button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : initial ? 'Save changes' : 'Create trip'}</button>
      </div>
    </form>
  );
}
