'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, today, isoDate, str, orNull, numOrNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Vehicle } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import ActiveToggle from '@/components/ActiveToggle';

const DOCS = [
  ['insurance_expiry', 'Insurance'], ['fitness_expiry', 'Fitness'],
  ['permit_expiry', 'Permit'], ['puc_expiry', 'PUC'],
] as const;

function soon() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return isoDate(d);
}

export default function VehiclesPage() {
  const { data, error, isLoading, mutate } = useSWR<Vehicle[]>('/vehicles', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Vehicle | null>(null);
  const [del, setDel] = useState<Vehicle | null>(null);

  const remove = async () => { if (del && await removeRecord(`/vehicles/${del.id}`, 'Vehicle')) mutate(); };
  const now = today();
  const limit = soon();

  return (
    <>
      <PageHeader title="Vehicles"
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add vehicle</button>} />
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <Spinner /> : !data || data.length === 0 ? (
        <EmptyState title="No vehicles yet" hint="Add your trucks to start creating trips." />
      ) : (
        <div className="space-y-2">
          {data.map((v) => {
            const docAlerts = DOCS.filter(([k]) => v[k] && v[k]! <= limit);
            return (
              <div key={v.id} className={cn('card flex flex-wrap items-start justify-between gap-3 p-4', !v.is_active && 'opacity-60')}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">{v.number} {!v.is_active && <InactiveBadge />}</p>
                  <p className="text-xs text-zinc-400">
                    {[v.brand, v.model, v.year].filter(Boolean).join(' · ')}
                    {v.emi_amount ? ` · EMI ${inr(v.emi_amount)}${v.emi_due_day ? ` on day ${v.emi_due_day}` : ''}` : ''}
                  </p>
                  {docAlerts.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {docAlerts.map(([k, label]) => {
                        const expired = v[k]! < now;
                        return (
                          <span key={k} className={cn('rounded-full px-2 py-0.5 text-xs',
                            expired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                            {label} {expired ? 'expired' : 'expires'} {fmtDate(v[k])}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="icon-btn" aria-label="Edit vehicle" onClick={() => { setEdit(v); setOpen(true); }}><Pencil size={15} /></button>
                  <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete vehicle" onClick={() => setDel(v)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit vehicle' : 'Add vehicle'}>
        <VehicleForm initial={edit} onSaved={() => { setOpen(false); mutate(); }} />
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove}
        title={`Delete ${del?.number ?? 'vehicle'}?`} message="If the vehicle has trips, it is only deactivated to keep history intact." />
    </>
  );
}

function VehicleForm({ initial, onSaved }: { initial: Vehicle | null; onSaved: () => void }) {
  const [f, setF] = useState({
    number: str(initial?.number), brand: str(initial?.brand), model: str(initial?.model), year: str(initial?.year),
    emi_amount: str(initial?.emi_amount), emi_due_day: str(initial?.emi_due_day),
    insurance_expiry: str(initial?.insurance_expiry), fitness_expiry: str(initial?.fitness_expiry),
    permit_expiry: str(initial?.permit_expiry), puc_expiry: str(initial?.puc_expiry),
    is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const payload = {
      number: f.number.trim().toUpperCase(), brand: f.brand.trim(), model: orNull(f.model.trim()),
      year: numOrNull(f.year), emi_amount: numOrNull(f.emi_amount), emi_due_day: numOrNull(f.emi_due_day),
      insurance_expiry: orNull(f.insurance_expiry), fitness_expiry: orNull(f.fitness_expiry),
      permit_expiry: orNull(f.permit_expiry), puc_expiry: orNull(f.puc_expiry),
      ...(initial ? { is_active: f.is_active } : {}),
    };
    try {
      if (initial) await api.put(`/vehicles/${initial.id}`, payload); else await api.post('/vehicles', payload);
      toast.success('Saved'); onSaved();
    } catch (err) { toast.error((err as Error).message); setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Vehicle number" required>
        <input className="input uppercase" required value={f.number} onChange={(e) => set('number', e.target.value)} placeholder="MH12AB1234" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand" required><input className="input" required value={f.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
        <Field label="Model"><input className="input" value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Year"><input type="number" inputMode="numeric" min={1980} max={2100} className="input" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="EMI amount (₹)"><input type="number" inputMode="decimal" min={0} className="input" value={f.emi_amount} onChange={(e) => set('emi_amount', e.target.value)} /></Field>
        <Field label="EMI due day (1–31)"><input type="number" inputMode="numeric" min={1} max={31} className="input" value={f.emi_due_day} onChange={(e) => set('emi_due_day', e.target.value)} /></Field>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Document expiry</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Insurance"><input type="date" className="input" value={f.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} /></Field>
          <Field label="Fitness"><input type="date" className="input" value={f.fitness_expiry} onChange={(e) => set('fitness_expiry', e.target.value)} /></Field>
          <Field label="Permit"><input type="date" className="input" value={f.permit_expiry} onChange={(e) => set('permit_expiry', e.target.value)} /></Field>
          <Field label="PUC"><input type="date" className="input" value={f.puc_expiry} onChange={(e) => set('puc_expiry', e.target.value)} /></Field>
        </div>
      </div>
      {initial && <ActiveToggle checked={f.is_active} onChange={(v) => set('is_active', v)} />}
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}
