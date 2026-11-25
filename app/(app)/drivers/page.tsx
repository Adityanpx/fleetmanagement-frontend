'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Phone, IdCard, Users, ArrowLeftRight } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, daysFromToday, today, str, orNull, numOrNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Driver } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import Switch from '@/components/ui/Switch';
import Segmented from '@/components/ui/Segmented';
import Avatar from '@/components/ui/Avatar';
import SearchInput from '@/components/ui/SearchInput';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { SkeletonList } from '@/components/ui/Skeleton';

export default function DriversPage() {
  const { data, error, isLoading, mutate } = useSWR<Driver[]>('/drivers', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Driver | null>(null);
  const [del, setDel] = useState<Driver | null>(null);
  const [settle, setSettle] = useState<Driver | null>(null);
  const [q, setQ] = useState('');

  const remove = async () => { if (del && await removeRecord(`/drivers/${del.id}`, 'Driver')) mutate(); };
  const weOwe = (data ?? []).reduce((a, d) => a + Math.max(0, Number(d.balance) || 0), 0);
  const theyOwe = (data ?? []).reduce((a, d) => a + Math.max(0, -(Number(d.balance) || 0)), 0);
  const shown = (data ?? []).filter((d) => !q || [d.name, d.phone, d.license_number].some((x) => x?.toLowerCase().includes(q.toLowerCase())));

  return (
    <>
      <PageHeader title="Drivers" subtitle="Balances roll up advances, money they spent for us, and settlements"
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add driver</button>} />

      {data && data.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="card bg-linear-to-br from-emerald-50 to-white p-4">
            <p className="text-xs font-medium text-zinc-500">We owe drivers</p>
            <AnimatedNumber value={weOwe} format={inr} className="text-xl font-semibold tabular-nums text-emerald-600" />
          </div>
          <div className="card bg-linear-to-br from-red-50 to-white p-4">
            <p className="text-xs font-medium text-zinc-500">Drivers owe us</p>
            <AnimatedNumber value={theyOwe} format={inr} className="text-xl font-semibold tabular-nums text-red-600" />
          </div>
        </div>
      )}
      {data && data.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search name, phone, licence…" className="mb-5 sm:w-80" />}

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <SkeletonList rows={3} /> : !data || data.length === 0 ? (
        <EmptyState icon={Users} title="No drivers yet" hint="Add drivers to track advances and what you owe them." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((d, i) => {
            const bal = Number(d.balance) || 0;
            const lic = d.license_expiry ? daysFromToday(d.license_expiry) : null;
            return (
              <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }}
                className={cn('card card-hover group flex flex-col p-5', !d.is_active && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <Avatar name={d.name} seed={d.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">{d.name} {!d.is_active && <InactiveBadge />}</p>
                    {d.phone ? (
                      <a href={`tel:${d.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"><Phone size={11} />{d.phone}</a>
                    ) : <p className="mt-0.5 text-xs text-zinc-400">No phone</p>}
                  </div>
                  <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" className="icon-btn" aria-label="Edit driver" onClick={() => { setEdit(d); setOpen(true); }}><Pencil size={15} /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete driver" onClick={() => setDel(d)}><Trash2 size={15} /></button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="chip bg-zinc-100 text-zinc-600"><IdCard size={12} />{d.license_number || 'No licence'}</span>
                  {lic !== null && (
                    <span className={cn('chip', lic < 0 ? 'bg-red-50 text-red-700' : lic <= 30 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')}>
                      {lic < 0 ? 'Licence expired' : lic <= 30 ? `Licence: ${lic}d left` : `Valid till ${fmtDate(d.license_expiry)}`}
                    </span>
                  )}
                  {d.salary ? <span className="chip bg-zinc-100 text-zinc-600">{inr(d.salary)}/mo</span> : null}
                </div>

                <div className={cn('mt-4 flex items-center justify-between gap-3 rounded-xl p-3',
                  bal > 0 ? 'bg-emerald-50' : bal < 0 ? 'bg-red-50' : 'bg-zinc-50')}>
                  <div>
                    <p className="text-[11px] text-zinc-500">{bal > 0 ? 'We owe' : bal < 0 ? 'Owes us' : 'Balance'}</p>
                    <p className={cn('text-lg font-semibold tabular-nums', bal > 0 ? 'text-emerald-700' : bal < 0 ? 'text-red-700' : 'text-zinc-400')}>
                      {bal === 0 ? 'Settled' : inr(Math.abs(bal))}
                    </p>
                  </div>
                  {bal !== 0 && (
                    <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setSettle(d)}><ArrowLeftRight size={13} /> Settle</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Edit ${edit.name}` : 'Add driver'}>
        <DriverForm initial={edit} onSaved={() => { setOpen(false); mutate(); }} />
      </Modal>
      <Modal open={!!settle} onClose={() => setSettle(null)} title={`Settle with ${settle?.name ?? ''}`}>
        {settle && <SettleForm driver={settle} onSaved={() => { setSettle(null); mutate(); }} />}
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove}
        title={`Delete ${del?.name ?? 'driver'}?`} message="If the driver has trips, they are only deactivated to keep history intact." />
    </>
  );
}

function DriverForm({ initial, onSaved }: { initial: Driver | null; onSaved: () => void }) {
  const [f, setF] = useState({
    name: str(initial?.name), phone: str(initial?.phone), license_number: str(initial?.license_number),
    license_expiry: str(initial?.license_expiry), salary: str(initial?.salary), is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const payload = {
      name: f.name.trim(), phone: orNull(f.phone.trim()), license_number: orNull(f.license_number.trim()),
      license_expiry: orNull(f.license_expiry), salary: numOrNull(f.salary),
      ...(initial ? { is_active: f.is_active } : {}),
    };
    try {
      if (initial) await api.put(`/drivers/${initial.id}`, payload); else await api.post('/drivers', payload);
      toast.success('Saved'); onSaved();
    } catch (err) { toast.error((err as Error).message); setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" required><input className="input" required value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone"><input type="tel" inputMode="tel" className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Salary (₹/mo)"><input type="number" inputMode="decimal" min={0} className="input" value={f.salary} onChange={(e) => set('salary', e.target.value)} /></Field>
        <Field label="Licence number"><input className="input" value={f.license_number} onChange={(e) => set('license_number', e.target.value)} /></Field>
        <Field label="Licence expiry"><input type="date" className="input" value={f.license_expiry} onChange={(e) => set('license_expiry', e.target.value)} /></Field>
      </div>
      {initial && <Switch checked={f.is_active} onChange={(v) => set('is_active', v)} label="Active" description="Inactive drivers are hidden when creating trips." />}
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Save driver'}</button>
    </form>
  );
}

/** Records cash that clears (part of) a driver's balance. */
function SettleForm({ driver, onSaved }: { driver: Driver; onSaved: () => void }) {
  const bal = Number(driver.balance) || 0;
  const [direction, setDirection] = useState<'paid_to_driver' | 'received_from_driver'>(bal > 0 ? 'paid_to_driver' : 'received_from_driver');
  const [amount, setAmount] = useState(String(Math.abs(bal)));
  const [settle_date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/drivers/${driver.id}/settlements`, { direction, amount: Number(amount), settle_date, note: orNull(note.trim()) });
      toast.success('Settlement recorded'); onSaved();
    } catch (err) { toast.error((err as Error).message); setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={cn('rounded-xl p-3 text-sm', bal > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
        Current balance: <b>{bal > 0 ? `we owe ${inr(bal)}` : `driver owes us ${inr(-bal)}`}</b>
      </div>
      <Segmented full value={direction} onChange={setDirection} options={[
        { value: 'paid_to_driver', label: 'We paid driver' },
        { value: 'received_from_driver', label: 'Driver paid us' },
      ]} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required>
          <input type="number" inputMode="decimal" min={0} step="any" className="input text-base font-semibold" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date" required>
          <input type="date" className="input" required value={settle_date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Record settlement'}</button>
    </form>
  );
}
