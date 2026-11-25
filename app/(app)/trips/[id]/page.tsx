'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import {
  ChevronLeft, Pencil, Trash2, Plus, PlayCircle, Flag, Ban, Building2, Package, Gauge, Calendar, Banknote, Receipt, RotateCcw,
} from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, today, str, orNull, numOrNull, daysBetween, pct, cn } from '@/lib/format';
import { CATEGORY, categoryColor } from '@/lib/meta';
import type { Expense, Trip, TripDetail, Status, Category } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import Segmented from '@/components/ui/Segmented';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { Skeleton, SkeletonStats } from '@/components/ui/Skeleton';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import ChartCard from '@/components/charts/ChartCard';
import SegmentedBar from '@/components/charts/SegmentedBar';
import ExpenseForm from '@/components/ExpenseForm';
import TripForm from '@/components/TripForm';

type PendingDelete =
  | { kind: 'trip' }
  | { kind: 'expense'; id: number; label: string }
  | { kind: 'payment'; id: number; label: string };

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: trip, error, isLoading, mutate } = useSWR<TripDetail>(`/trips/${id}`, fetcher);

  const [expOpen, setExpOpen] = useState(false);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState<Status | null>(null);
  const [pendingDel, setPendingDel] = useState<PendingDelete | null>(null);
  const [busy, setBusy] = useState(false);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (isLoading || !trip) return (
    <div className="space-y-6"><Skeleton className="h-4 w-20" /><Skeleton className="h-40 w-full rounded-2xl" /><SkeletonStats /></div>
  );

  async function confirmDelete() {
    if (!pendingDel) return;
    try {
      if (pendingDel.kind === 'trip') {
        await api.del(`/trips/${id}`);
        toast.success('Trip deleted');
        router.replace('/trips');
        return;
      }
      if (pendingDel.kind === 'expense') await api.del(`/expenses/${pendingDel.id}`);
      else await api.del(`/trips/${id}/payments/${pendingDel.id}`);
      toast.success('Removed');
      mutate();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function quickStatus(status: Status) {
    setBusy(true);
    try { await api.patch(`/trips/${id}/status`, { status }); toast.success(status === 'running' ? 'Trip started' : 'Status updated'); mutate(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  const freight = Number(trip.freight_amount || 0);
  const companyDiesel = Number(trip.company_diesel || 0);
  const income = Number(trip.income || 0);
  const cost = Number(trip.owner_cost || 0);
  const profit = Number(trip.profit || 0);
  const received = Number(trip.received || 0);
  const pending = Number(trip.pending || 0);
  const dest = trip.actual_end_location || trip.expected_end_location || '—';
  const cancelled = trip.status === 'cancelled';

  // Owner-borne costs by category (what profit is reduced by)
  const costByCat = new Map<Category, number>();
  trip.expenses.filter((e) => e.paid_by === 'ourselves')
    .forEach((e) => costByCat.set(e.category, (costByCat.get(e.category) || 0) + Number(e.amount)));

  return (
    <>
      <Link href="/trips" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:-translate-x-0.5 hover:text-zinc-900">
        <ChevronLeft size={16} /> All trips
      </Link>

      {/* Hero */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="card relative mb-6 overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-linear-to-br from-indigo-200/50 to-violet-200/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">{trip.vehicle_number}</h1>
              <Badge status={trip.status} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <MetaChip icon={Building2}>{trip.company_name || 'No company'}</MetaChip>
              {trip.cargo && <MetaChip icon={Package}>{trip.cargo}{trip.quantity ? ` · ${trip.quantity} t` : ''}</MetaChip>}
              {trip.km != null && <MetaChip icon={Gauge}>{trip.km} km</MetaChip>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {trip.status === 'scheduled' && <button type="button" disabled={busy} className="btn-primary" onClick={() => quickStatus('running')}><PlayCircle size={16} /> Start trip</button>}
            {trip.status === 'running' && <button type="button" className="btn-primary" onClick={() => setStatusOpen('completed')}><Flag size={16} /> Complete</button>}
            {(trip.status === 'completed' || cancelled) && <button type="button" className="btn-secondary" onClick={() => setStatusOpen(trip.status)}><RotateCcw size={15} /> Change status</button>}
            <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> Edit</button>
            {(trip.status === 'scheduled' || trip.status === 'running') && (
              <button type="button" className="btn-ghost text-zinc-500" onClick={() => setStatusOpen('cancelled')}><Ban size={15} /> Cancel</button>
            )}
          </div>
        </div>

        <Route trip={trip} dest={dest} />

        {cancelled && trip.cancel_reason && (
          <p className="relative mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-100">Cancelled: {trip.cancel_reason}</p>
        )}
        {trip.notes && <p className="relative mt-4 rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-600">{trip.notes}</p>}
      </motion.section>

      {/* Money flow */}
      <Stagger className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <FlowStep label="Freight" value={freight} />
        <FlowStep label="Company diesel" value={trip.deduct_company_diesel ? -companyDiesel : 0}
          hint={companyDiesel === 0 ? 'none given' : trip.deduct_company_diesel ? 'deducted' : `${inr(companyDiesel)} · free`} muted />
        <FlowStep label={cancelled ? 'Income (cancelled)' : 'Income'} value={income} accent="blue" />
        <FlowStep label="Our costs" value={-cost} hint={`${trip.diesel_litres || 0} L diesel`} muted />
        <FlowStep label="Profit" value={profit} accent={profit >= 0 ? 'green' : 'red'} big className="col-span-2 md:col-span-1" />
      </Stagger>

      <div className="mb-6 grid gap-6 lg:grid-cols-5">
        {/* Payment progress */}
        <ChartCard className="lg:col-span-2" title="Payment" subtitle={cancelled ? 'Trip cancelled' : `${pct(received, income).toFixed(0)}% of income received`}
          action={<button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setPayOpen(true)}><Plus size={14} /> Add payment</button>}>
          <div className="mb-1 flex items-baseline justify-between">
            <AnimatedNumber value={received} format={inr} className="text-2xl font-semibold tabular-nums text-emerald-600" />
            <span className="text-sm text-zinc-400">of {inr(income)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
            <motion.div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600"
              initial={{ width: 0 }} animate={{ width: `${pct(received, income)}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </div>
          <p className={cn('mt-2 text-sm font-medium', pending > 0 ? 'text-amber-600' : 'text-emerald-600')}>
            {pending > 0 ? `${inr(pending)} still to receive` : pending < 0 ? `${inr(-pending)} received in excess` : 'Fully paid ✓'}
          </p>
          {trip.payments.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-zinc-100 pt-3">
              {trip.payments.map((p) => (
                <li key={p.id} className="group flex items-center gap-3 rounded-lg py-1.5 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><Banknote size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium tabular-nums">{inr(p.amount)}</p>
                    <p className="truncate text-xs text-zinc-400">{fmtDate(p.payment_date)}{p.mode ? ` · ${p.mode.toUpperCase()}` : ''}{p.note ? ` · ${p.note}` : ''}</p>
                  </div>
                  <button type="button" className="icon-btn opacity-60 group-hover:opacity-100 hover:text-red-600" aria-label="Delete payment"
                    onClick={() => setPendingDel({ kind: 'payment', id: p.id, label: `payment of ${inr(p.amount)}` })}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        {/* Cost breakdown */}
        <ChartCard className="lg:col-span-3" title="Cost breakdown" subtitle="What this trip cost us (company-paid excluded)">
          <SegmentedBar thick segments={[...costByCat.entries()].sort((a, b) => b[1] - a[1]).map(([c, v]) => {
            const Icon = CATEGORY[c].icon;
            return { key: c, label: CATEGORY[c].label, value: v, color: categoryColor(c), icon: <Icon size={14} className="text-zinc-400" /> };
          })} />
        </ChartCard>
      </div>

      {/* Expenses timeline */}
      <ChartCard title="Expenses" subtitle={`${trip.expenses.length} entries`} className="mb-6"
        action={<button type="button" className="btn-primary" onClick={() => { setEditExp(null); setExpOpen(true); }}><Plus size={15} /> Add expense</button>}>
        {trip.expenses.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-400">
            <Receipt size={22} /> No expenses yet. Add diesel, tolls, repairs and more.
          </div>
        ) : (
          <ul className="relative space-y-1 before:absolute before:bottom-4 before:left-[19px] before:top-4 before:w-px before:bg-zinc-100">
            {trip.expenses.map((e, i) => {
              const meta = CATEGORY[e.category];
              const free = e.paid_by === 'company' && e.category === 'diesel' && !trip.deduct_company_diesel;
              return (
                <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 12) * 0.03 }}
                  className="group relative flex items-center gap-3 rounded-xl py-2 pr-1 transition-colors hover:bg-zinc-50">
                  <span className={cn('relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-4 ring-white', meta.tint)}><meta.icon size={17} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{meta.label}</p>
                    {(() => {
                      const detail = [e.litres != null ? `${e.litres} L${e.rate != null ? ` @ ${inr(e.rate)}` : ''}` : '', e.fill_location, e.work_detail].filter(Boolean).join(' · ');
                      return detail ? <p className="truncate text-xs text-zinc-500">{detail}</p> : null;
                    })()}
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400">
                      {fmtDate(e.expense_date)}
                      <PaidByChip paidBy={e.paid_by} />
                      {e.vendor_name && <span>· {e.vendor_name}</span>}
                      {e.note && <span>· {e.note}</span>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold tabular-nums', free && 'text-zinc-400 line-through decoration-zinc-300')}>{inr(e.amount)}</p>
                    {free && <p className="text-[11px] text-zinc-400">free</p>}
                  </div>
                  <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" className="icon-btn" aria-label="Edit expense" onClick={() => { setEditExp(e); setExpOpen(true); }}><Pencil size={14} /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete expense"
                      onClick={() => setPendingDel({ kind: 'expense', id: e.id, label: `${meta.label} of ${inr(e.amount)}` })}><Trash2 size={14} /></button>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      <div className="flex justify-end">
        <button type="button" className="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setPendingDel({ kind: 'trip' })}><Trash2 size={15} /> Delete trip</button>
      </div>

      {/* Modals (each form mounts fresh when its modal opens) */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={editExp ? 'Edit expense' : 'Add expense'} subtitle={`${trip.vehicle_number} · ${trip.start_location} → ${dest}`}>
        <ExpenseForm tripId={trip.id} tripCompanyId={trip.company_id}
          deductsDiesel={trip.deduct_company_diesel}
          initial={editExp} onSaved={() => { setExpOpen(false); mutate(); }} />
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Add payment received" subtitle={trip.company_name ? `From ${trip.company_name}` : undefined}>
        <PaymentForm tripId={trip.id} pending={pending} onSaved={() => { setPayOpen(false); mutate(); }} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit trip" wide>
        <TripForm initial={trip} onSaved={() => { setEditOpen(false); mutate(); }} />
      </Modal>

      <Modal open={!!statusOpen} onClose={() => setStatusOpen(null)} title="Change status">
        {statusOpen && <StatusForm trip={trip} initialStatus={statusOpen} onSaved={() => { setStatusOpen(null); mutate(); }} />}
      </Modal>

      <ConfirmDialog open={!!pendingDel} onClose={() => setPendingDel(null)} onConfirm={confirmDelete}
        title={pendingDel?.kind === 'trip' ? 'Delete this trip?' : `Delete ${pendingDel?.kind ?? ''}?`}
        message={pendingDel?.kind === 'trip'
          ? 'This permanently removes the trip and all its expenses and payments. This cannot be undone.'
          : `This removes the ${pendingDel?.label ?? 'entry'} and updates the trip totals.`} />
    </>
  );
}

function MetaChip({ icon: Icon, children }: { icon: typeof Building2; children: React.ReactNode }) {
  return <span className="chip bg-white/80 text-zinc-600 ring-1 ring-inset ring-zinc-200"><Icon size={12} className="text-zinc-400" />{children}</span>;
}

function PaidByChip({ paidBy }: { paidBy: Expense['paid_by'] }) {
  const m = { ourselves: ['Ours', 'bg-zinc-100 text-zinc-600'], company: ['Company', 'bg-blue-50 text-blue-700'] }[paidBy];
  return <span className={cn('rounded-md px-1.5 py-px text-[11px] font-medium', m[1])}>{m[0]}</span>;
}

/** Start → end with an animated dashed line and a truck that rides along for running trips. */
function Route({ trip, dest }: { trip: Trip; dest: string }) {
  const end = trip.actual_end_date || trip.expected_end_date;
  const total = end ? Math.max(1, daysBetween(trip.start_date, end)) : 0;
  const progress = trip.status === 'completed' ? 100 : trip.status === 'running' && total
    ? Math.min(96, pct(daysBetween(trip.start_date, today()), total)) : trip.status === 'running' ? 40 : 0;
  return (
    <div className="relative mt-6">
      <div className="flex items-end justify-between gap-4 text-sm">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">From</p>
          <p className="truncate font-semibold">{trip.start_location}</p>
          <p className="flex items-center gap-1 text-xs text-zinc-500"><Calendar size={11} />{fmtDate(trip.start_date)}{trip.start_odometer != null ? ` · ${trip.start_odometer} km` : ''}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{trip.actual_end_location ? 'Reached' : 'To'}</p>
          <p className="truncate font-semibold">{dest}</p>
          <p className="flex items-center justify-end gap-1 text-xs text-zinc-500"><Calendar size={11} />{end ? fmtDate(end) : 'No date'}{trip.end_odometer != null ? ` · ${trip.end_odometer} km` : ''}</p>
        </div>
      </div>
      <div className="relative mt-3 h-6">
        <svg className="absolute inset-x-0 top-1/2 h-1 w-full -translate-y-1/2 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 2">
          <line x1="0" y1="1" x2="100" y2="1" stroke="#e4e4e7" strokeWidth="2" strokeDasharray="2 2" vectorEffect="non-scaling-stroke"
            className={trip.status === 'running' ? 'animate-dash' : ''} />
        </svg>
        <motion.div className={cn('absolute top-1/2 h-1 -translate-y-1/2 rounded-full',
          trip.status === 'cancelled' ? 'bg-red-300' : trip.status === 'completed' ? 'bg-emerald-500' : 'bg-linear-to-r from-indigo-500 to-blue-500')}
          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} />
        <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] border-indigo-500 bg-white" />
        <span className={cn('absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-[3px] bg-white',
          trip.status === 'completed' ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-300')} />
      </div>
    </div>
  );
}

function FlowStep({ label, value, hint, accent, muted, big, className }: {
  label: string; value: number; hint?: string; accent?: 'blue' | 'green' | 'red'; muted?: boolean; big?: boolean; className?: string;
}) {
  return (
    <StaggerItem className={cn('card relative p-4', accent === 'green' && 'bg-linear-to-br from-emerald-50 to-white ring-1 ring-inset ring-emerald-100',
      accent === 'red' && 'bg-linear-to-br from-red-50 to-white ring-1 ring-inset ring-red-100',
      accent === 'blue' && 'bg-linear-to-br from-blue-50/70 to-white', className)}>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <AnimatedNumber value={value} format={(n) => (n < 0 ? `− ${inr(-n)}` : inr(n))}
        className={cn('mt-1 block font-semibold tabular-nums tracking-tight', big ? 'text-2xl' : 'text-lg',
          muted && 'text-zinc-500', accent === 'blue' && 'text-blue-700', accent === 'green' && 'text-emerald-600', accent === 'red' && 'text-red-600')} />
      {hint && <p className="mt-0.5 text-[11px] text-zinc-400">{hint}</p>}
    </StaggerItem>
  );
}

/* ---- Payment form ---- */
function PaymentForm({ tripId, pending, onSaved }: { tripId: number; pending: number; onSaved: () => void }) {
  const [amount, setAmount] = useState(pending > 0 ? String(pending) : '');
  const [payment_date, setDate] = useState(today);
  const [mode, setMode] = useState('bank');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      await api.post(`/trips/${tripId}/payments`, { amount: Number(amount), payment_date, mode: orNull(mode), note: orNull(note.trim()) });
      toast.success('Payment added'); onSaved();
    } catch (err) { toast.error((err as Error).message); setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Amount (₹)" required hint={pending > 0 ? `${inr(pending)} pending on this trip` : undefined}>
        <input type="number" inputMode="decimal" min={0} step="any" className="input text-lg font-semibold" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <Field label="Mode">
        <Segmented full value={mode} onChange={setMode} options={[
          { value: 'bank', label: 'Bank' }, { value: 'upi', label: 'UPI' }, { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
        ]} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" className="input" required value={payment_date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></Field>
      </div>
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Add payment'}</button>
    </form>
  );
}

/* ---- Status form (mirrors the backend's completion & cancel rules) ---- */
function StatusForm({ trip, initialStatus, onSaved }: { trip: Trip; initialStatus: Status; onSaved: () => void }) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [actual_end_date, setEndDate] = useState(trip.actual_end_date || today());
  const [actual_end_location, setEndLoc] = useState(str(trip.actual_end_location || trip.expected_end_location));
  const [end_odometer, setOdo] = useState(str(trip.end_odometer));
  const [cancel_reason, setReason] = useState(str(trip.cancel_reason));
  const [loading, setLoading] = useState(false);
  const km = numOrNull(end_odometer) != null && trip.start_odometer != null ? Number(end_odometer) - trip.start_odometer : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const odo = numOrNull(end_odometer);
    if (status === 'completed' && trip.start_odometer != null && odo != null && odo < trip.start_odometer) {
      toast.error(`End odometer can't be less than the start (${trip.start_odometer} km).`);
      return;
    }
    setLoading(true);
    const body: Record<string, unknown> = { status };
    if (status === 'completed') Object.assign(body, { actual_end_date, actual_end_location: orNull(actual_end_location.trim()), end_odometer: odo });
    if (status === 'cancelled') body.cancel_reason = cancel_reason.trim();
    try { await api.patch(`/trips/${trip.id}/status`, body); toast.success('Status updated'); onSaved(); }
    catch (err) { toast.error((err as Error).message); setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Segmented full size="sm" value={status} onChange={setStatus} options={[
        { value: 'scheduled', label: 'Scheduled' }, { value: 'running', label: 'Running' },
        { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
      ]} />
      {status === 'completed' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Actual end date" required>
              <input type="date" className="input" required min={trip.start_date} value={actual_end_date} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
            <Field label="End odometer (km)" required hint={trip.start_odometer != null ? `Start was ${trip.start_odometer} km` : undefined}>
              <input type="number" inputMode="numeric" className="input" required min={trip.start_odometer ?? 0}
                value={end_odometer} onChange={(e) => setOdo(e.target.value)} />
            </Field>
          </div>
          <Field label="Actual end location">
            <input className="input" value={actual_end_location} onChange={(e) => setEndLoc(e.target.value)} />
          </Field>
          {km != null && km >= 0 && (
            <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700">Distance covered: <b>{km} km</b></p>
          )}
        </motion.div>
      )}
      {status === 'cancelled' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <Field label="Reason" required hint="A cancelled trip earns nothing; its costs still count.">
            <input className="input" required value={cancel_reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Plant shutdown" />
          </Field>
        </motion.div>
      )}
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Save status'}</button>
    </form>
  );
}
