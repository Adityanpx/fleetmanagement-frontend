'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Bus, ShieldCheck, CalendarClock, ShieldAlert } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, fmtMonth, daysFromToday, str, orNull, numOrNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Vehicle } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import Switch from '@/components/ui/Switch';
import SearchInput from '@/components/ui/SearchInput';
import { SkeletonList } from '@/components/ui/Skeleton';

const DOCS = [
  ['insurance_expiry', 'Insurance'], ['fitness_expiry', 'Fitness'],
  ['permit_expiry', 'Permit'], ['puc_expiry', 'PUC'],
] as const;

interface VehicleStats { id: number; trips: number; income: number; profit: number; km: number }

type Health = 'ok' | 'soon' | 'expired' | 'unset';
const health = (d?: string | null): Health => !d ? 'unset' : daysFromToday(d) < 0 ? 'expired' : daysFromToday(d) <= 30 ? 'soon' : 'ok';
const HEALTH_STYLE: Record<Health, string> = {
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  soon: 'bg-amber-50 text-amber-700 ring-amber-100',
  expired: 'bg-red-50 text-red-700 ring-red-100',
  unset: 'bg-zinc-50 text-zinc-400 ring-zinc-100',
};

export default function VehiclesPage() {
  const { data, error, isLoading, mutate } = useSWR<Vehicle[]>('/vehicles', fetcher);
  const { data: stats } = useSWR<{ rows: VehicleStats[] }>('/reports/vehicles', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Vehicle | null>(null);
  const [del, setDel] = useState<Vehicle | null>(null);
  const [q, setQ] = useState('');

  const remove = async () => { if (del && await removeRecord(`/vehicles/${del.id}`, 'Vehicle')) mutate(); };
  const byId = useMemo(() => new Map((stats?.rows ?? []).map((r) => [r.id, r])), [stats]);
  const shown = (data ?? []).filter((v) => !q || [v.number, v.brand, v.model].some((x) => x?.toLowerCase().includes(q.toLowerCase())));
  const alerts = (data ?? []).filter((v) => v.is_active && DOCS.some(([k]) => ['soon', 'expired'].includes(health(v[k])))).length;

  return (
    <>
      <PageHeader title="Vehicles" subtitle={data ? `${data.filter((v) => v.is_active).length} active trucks${alerts ? ` · ${alerts} need paperwork attention` : ''}` : 'Your trucks and their papers'}
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add vehicle</button>} />

      {data && data.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search number, brand, model…" className="mb-5 sm:w-80" />}

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <SkeletonList rows={3} /> : !data || data.length === 0 ? (
        <EmptyState icon={Bus} title="No vehicles yet" hint="Add your trucks to start creating trips." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((v, i) => {
            const s = byId.get(v.id);
            return (
              <motion.div key={v.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }}
                className={cn('card card-hover group flex flex-col p-5', !v.is_active && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-zinc-800 to-zinc-950 text-white shadow-lift"><Bus size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold tracking-tight">{v.number} {!v.is_active && <InactiveBadge />}</p>
                    <p className="truncate text-xs text-zinc-500">{[v.brand, v.model, v.year].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" className="icon-btn" aria-label="Edit vehicle" onClick={() => { setEdit(v); setOpen(true); }}><Pencil size={15} /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete vehicle" onClick={() => setDel(v)}><Trash2 size={15} /></button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-3 text-center">
                  <Stat label="Trips" value={String(s?.trips ?? 0)} />
                  <Stat label="Km" value={Number(s?.km ?? 0).toLocaleString('en-IN')} />
                  <Stat label="Profit" value={inr(s?.profit ?? 0)} tone={Number(s?.profit ?? 0) >= 0 ? 'pos' : 'neg'} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {DOCS.map(([k, label]) => {
                    const h = health(v[k]);
                    const Icon = h === 'ok' ? ShieldCheck : h === 'unset' ? CalendarClock : ShieldAlert;
                    return (
                      <div key={k} className={cn('flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] ring-1 ring-inset', HEALTH_STYLE[h])}
                        title={v[k] ? `${label}: ${fmtDate(v[k])}` : `${label}: not set`}>
                        <Icon size={12} className="shrink-0" />
                        <span className="font-medium">{label}</span>
                        <span className="ml-auto truncate">
                          {h === 'unset' ? '—' : h === 'expired' ? 'Expired' : h === 'soon' ? `${daysFromToday(v[k]!)}d` : fmtMonth(v[k]!.slice(0, 7))}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {v.emi_amount ? (
                  <p className="mt-3 text-xs text-zinc-500">EMI <b className="text-zinc-700">{inr(v.emi_amount)}</b>{v.emi_due_day ? ` · due on day ${v.emi_due_day}` : ''}</p>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Edit ${edit.number}` : 'Add vehicle'}>
        <VehicleForm initial={edit} onSaved={() => { setOpen(false); mutate(); }} />
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove}
        title={`Delete ${del?.number ?? 'vehicle'}?`} message="If the vehicle has trips, it is only deactivated to keep history intact." />
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'pos' | 'neg' }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-zinc-400">{label}</p>
      <p className={cn('truncate text-sm font-semibold tabular-nums', tone === 'pos' && 'text-emerald-600', tone === 'neg' && 'text-red-600')}>{value}</p>
    </div>
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
        <input className="input text-base font-semibold uppercase tracking-wide" required value={f.number} onChange={(e) => set('number', e.target.value)} placeholder="MH12AB1234" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Brand" required><input className="input" required value={f.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Tata" /></Field>
        <Field label="Model"><input className="input" value={f.model} onChange={(e) => set('model', e.target.value)} /></Field>
        <Field label="Year"><input type="number" inputMode="numeric" min={1980} max={2100} className="input" value={f.year} onChange={(e) => set('year', e.target.value)} /></Field>
        <Field label="EMI amount (₹)"><input type="number" inputMode="decimal" min={0} className="input" value={f.emi_amount} onChange={(e) => set('emi_amount', e.target.value)} /></Field>
        <Field label="EMI due day (1–31)"><input type="number" inputMode="numeric" min={1} max={31} className="input" value={f.emi_due_day} onChange={(e) => set('emi_due_day', e.target.value)} /></Field>
      </div>
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"><ShieldCheck size={13} /> Document expiry</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Insurance"><input type="date" className="input" value={f.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} /></Field>
          <Field label="Fitness"><input type="date" className="input" value={f.fitness_expiry} onChange={(e) => set('fitness_expiry', e.target.value)} /></Field>
          <Field label="Permit"><input type="date" className="input" value={f.permit_expiry} onChange={(e) => set('permit_expiry', e.target.value)} /></Field>
          <Field label="PUC"><input type="date" className="input" value={f.puc_expiry} onChange={(e) => set('puc_expiry', e.target.value)} /></Field>
        </div>
      </div>
      {initial && <Switch checked={f.is_active} onChange={(v) => set('is_active', v)} label="Active" description="Inactive vehicles are hidden when creating trips." />}
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Save vehicle'}</button>
    </form>
  );
}
