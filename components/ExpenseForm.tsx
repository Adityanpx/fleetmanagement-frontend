'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { api, fetcher } from '@/lib/api';
import { today, str, orNull, numOrNull, inr, cn } from '@/lib/format';
import { CATEGORY } from '@/lib/meta';
import { AnimatePresence, motion } from 'motion/react';
import Segmented from '@/components/ui/Segmented';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import type { Category, Company, Expense, PaidBy } from '@/lib/types';

interface FormState {
  category: Category; amount: string; expense_date: string; paid_by: PaidBy; company_id: string;
  mode: string; vendor_name: string; note: string; litres: string; rate: string;
  fill_location: string; work_detail: string;
}

function fromExpense(e: Expense | null | undefined, tripCompanyId?: number | null): FormState {
  return {
    category: e?.category ?? 'diesel', amount: str(e?.amount), expense_date: e?.expense_date || today(),
    paid_by: e?.paid_by ?? 'ourselves', company_id: str(e?.company_id ?? tripCompanyId),
    mode: str(e?.mode), vendor_name: str(e?.vendor_name), note: str(e?.note),
    litres: str(e?.litres), rate: str(e?.rate), fill_location: str(e?.fill_location), work_detail: str(e?.work_detail),
  };
}

/** litres x rate, rounded to paise; '' when either is missing so manual entry stays possible. */
function dieselAmount(litres: string, rate: string, fallback: string) {
  if (litres === '' || rate === '') return fallback;
  return String(Math.round(Number(litres) * Number(rate) * 100) / 100);
}

export default function ExpenseForm({ tripId, tripCompanyId, deductsDiesel, initial, onSaved }: {
  tripId: number; tripCompanyId?: number | null; deductsDiesel: boolean;
  initial?: Expense | null; onSaved: () => void;
}) {
  const { data: companies } = useSWR<Company[]>('/companies', fetcher);
  const [f, setF] = useState<FormState>(() => fromExpense(initial, tripCompanyId));
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  const isDiesel = f.category === 'diesel';
  const needsDetail = ['tyre', 'repair', 'fine', 'other'].includes(f.category);
  const autoAmount = isDiesel && f.litres !== '' && f.rate !== '';

  function setCategory(category: Category) {
    setF((p) => ({
      ...p, category,
      amount: category === 'diesel' ? dieselAmount(p.litres, p.rate, p.amount) : p.amount,
    }));
  }
  const setLitres = (litres: string) => setF((p) => ({ ...p, litres, amount: dieselAmount(litres, p.rate, p.amount) }));
  const setRate = (rate: string) => setF((p) => ({ ...p, rate, amount: dieselAmount(p.litres, rate, p.amount) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      category: f.category,
      amount: Number(f.amount),
      expense_date: f.expense_date,
      paid_by: f.paid_by,
      company_id: f.paid_by === 'company' ? numOrNull(f.company_id) ?? tripCompanyId ?? null : null,
      mode: orNull(f.mode),
      vendor_name: orNull(f.vendor_name.trim()),
      note: orNull(f.note.trim()),
      litres: isDiesel ? numOrNull(f.litres) : null,
      rate: isDiesel ? numOrNull(f.rate) : null,
      fill_location: isDiesel ? orNull(f.fill_location.trim()) : null,
      work_detail: needsDetail ? orNull(f.work_detail.trim()) : null,
    };
    try {
      if (initial) await api.put(`/expenses/${initial.id}`, payload);
      else await api.post(`/trips/${tripId}/expenses`, payload);
      toast.success(initial ? 'Expense updated' : 'Expense added');
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  const order: Category[] = ['diesel', 'toll', 'food', 'loading_unloading', 'parking', 'tyre', 'repair', 'fine', 'other'];

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Category picker */}
      <div>
        <label className="label">Category</label>
        <div className="grid grid-cols-5 gap-2">
          {order.map((c) => {
            const m = CATEGORY[c];
            const active = f.category === c;
            return (
              <button key={c} type="button" onClick={() => setCategory(c)} title={m.label}
                className={cn('relative flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-[11px] font-medium transition active:scale-95',
                  active ? 'border-indigo-300 bg-indigo-50 text-indigo-700 shadow-glow' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50')}>
                <span className={cn('grid h-8 w-8 place-items-center rounded-lg transition', active ? 'bg-white text-indigo-600' : m.tint)}><m.icon size={16} /></span>
                <span className="w-full truncate text-center">{m.label.split(' / ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {isDiesel && (
          <motion.div key="diesel" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/80 to-white p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Litres"><input type="number" inputMode="decimal" min={0} step="any" className="input" value={f.litres} onChange={(e) => setLitres(e.target.value)} placeholder="0" /></Field>
                <Field label="Rate (₹/L)"><input type="number" inputMode="decimal" min={0} step="any" className="input" value={f.rate} onChange={(e) => setRate(e.target.value)} placeholder="0" /></Field>
              </div>
              {autoAmount && (
                <p className="mt-2 text-xs text-blue-700">{f.litres} L × ₹{f.rate} = <b>{inr(Number(f.amount))}</b></p>
              )}
              <div className="mt-3"><Field label="Fill location" required>
                <input className="input" required value={f.fill_location} onChange={(e) => set('fill_location', e.target.value)} placeholder="Pump / place" /></Field></div>
            </div>
          </motion.div>
        )}
        {needsDetail && (
          <motion.div key="detail" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <Field label={f.category === 'fine' ? 'Reason' : f.category === 'tyre' ? 'Tyre / work' : 'Details'} required={f.category === 'other'}>
              <input className="input" required={f.category === 'other'} value={f.work_detail} onChange={(e) => set('work_detail', e.target.value)} />
            </Field>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)" required hint={autoAmount ? 'litres × rate' : undefined}>
          <input type="number" inputMode="decimal" min={0} step="any" className="input text-base font-semibold" required value={f.amount}
            onChange={(e) => set('amount', e.target.value)} readOnly={autoAmount} placeholder="0" />
        </Field>
        <Field label="Date" required>
          <input type="date" className="input" required value={f.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
        </Field>
      </div>

      <div>
        <label className="label">Paid by</label>
        <Segmented full value={f.paid_by} onChange={(v) => set('paid_by', v)} options={[
          { value: 'ourselves', label: 'Ourselves' },
          { value: 'company', label: 'Company' },
        ]} />
        <p className="mt-1.5 text-xs text-zinc-500">
          {isDiesel && f.paid_by === 'company'
            ? (deductsDiesel ? 'Deducted from this trip’s freight.' : 'This trip does not deduct company diesel, so it costs nothing.')
            : f.paid_by === 'company' ? 'Paid by the company; not our cost.' : 'Paid from our pocket — counts as trip cost.'}
        </p>
      </div>

      {f.paid_by === 'company' && (
        <Field label="Which company" required={!tripCompanyId}>
          <Select value={f.company_id} required={!tripCompanyId} onChange={(e) => set('company_id', e.target.value)}>
            <option value="">{tripCompanyId ? 'Trip company' : 'Select company'}</option>
            {companies?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mode">
          <Select value={f.mode} onChange={(e) => set('mode', e.target.value)}>
            <option value="">—</option><option value="cash">Cash</option><option value="upi">UPI</option>
            <option value="bank">Bank</option><option value="card">Fuel card</option>
          </Select>
        </Field>
        <Field label="Vendor / name"><input className="input" value={f.vendor_name} onChange={(e) => set('vendor_name', e.target.value)} placeholder="Optional" /></Field>
      </div>

      <Field label="Note"><input className="input" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional" /></Field>

      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : initial ? 'Save changes' : 'Add expense'}</button>
    </form>
  );
}
