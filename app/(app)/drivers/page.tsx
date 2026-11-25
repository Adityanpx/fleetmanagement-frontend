'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, today, str, orNull, numOrNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Driver } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import ActiveToggle from '@/components/ActiveToggle';

export default function DriversPage() {
  const { data, error, isLoading, mutate } = useSWR<Driver[]>('/drivers', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Driver | null>(null);
  const [del, setDel] = useState<Driver | null>(null);
  const [settle, setSettle] = useState<Driver | null>(null);

  const remove = async () => { if (del && await removeRecord(`/drivers/${del.id}`, 'Driver')) mutate(); };

  return (
    <>
      <PageHeader title="Drivers" subtitle="Balances include advances, own spends and settlements"
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add driver</button>} />
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <Spinner /> : !data || data.length === 0 ? (
        <EmptyState title="No drivers yet" hint="Add drivers to track advances and what you owe them." />
      ) : (
        <div className="space-y-2">
          {data.map((d) => {
            const bal = Number(d.balance) || 0;
            return (
              <div key={d.id} className={cn('card flex flex-wrap items-center justify-between gap-3 p-4', !d.is_active && 'opacity-60')}>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">{d.name} {!d.is_active && <InactiveBadge />}</p>
                  <p className="text-xs text-zinc-400">
                    {d.phone || 'No phone'} · Lic {d.license_number || '—'}
                    {d.license_expiry && <> · expires <span className={d.license_expiry < today() ? 'text-red-500' : ''}>{fmtDate(d.license_expiry)}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn('mr-2 text-sm font-medium tabular-nums',
                    bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-red-600' : 'text-zinc-400')}>
                    {bal > 0 ? `We owe ${inr(bal)}` : bal < 0 ? `Owes us ${inr(-bal)}` : 'Settled'}</span>
                  {bal !== 0 && <button type="button" className="btn-ghost px-2 text-xs" onClick={() => setSettle(d)}>Settle</button>}
                  <button type="button" className="icon-btn" aria-label="Edit driver" onClick={() => { setEdit(d); setOpen(true); }}><Pencil size={15} /></button>
                  <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete driver" onClick={() => setDel(d)}><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit driver' : 'Add driver'}>
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
      {initial && <ActiveToggle checked={f.is_active} onChange={(v) => set('is_active', v)} />}
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}

/** Records cash that clears (part of) a driver's balance. */
function SettleForm({ driver, onSaved }: { driver: Driver; onSaved: () => void }) {
  const bal = Number(driver.balance) || 0;
  const [direction, setDirection] = useState(bal > 0 ? 'paid_to_driver' : 'received_from_driver');
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
      <p className="text-sm text-zinc-500">
        Current balance: <span className={bal > 0 ? 'text-emerald-600' : 'text-red-600'}>
          {bal > 0 ? `we owe ${inr(bal)}` : `driver owes us ${inr(-bal)}`}</span>
      </p>
      <Field label="Direction" required>
        <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="paid_to_driver">We paid the driver</option>
          <option value="received_from_driver">Driver paid us back</option>
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required>
          <input type="number" inputMode="decimal" min={0} step="any" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Date" required>
          <input type="date" className="input" required value={settle_date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Record settlement'}</button></div>
    </form>
  );
}
