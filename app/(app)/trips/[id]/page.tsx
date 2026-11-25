'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { ChevronLeft, Pencil, Trash2, Plus } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, fmtDate, titleCase, today, str, orNull, numOrNull } from '@/lib/format';
import type { Expense, Trip, TripDetail, Status } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Badge from '@/components/ui/Badge';
import StatTile from '@/components/ui/StatTile';
import Spinner from '@/components/ui/Spinner';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
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
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingDel, setPendingDel] = useState<PendingDelete | null>(null);

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />;
  if (isLoading || !trip) return <Spinner />;

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

  const destination = trip.actual_end_location || trip.expected_end_location || '—';

  return (
    <>
      <Link href="/trips" className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900">
        <ChevronLeft size={16} /> Trips
      </Link>
      <PageHeader title={trip.vehicle_number || 'Trip'} subtitle={`${trip.start_location} → ${destination}`}
        action={<div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}><Pencil size={15} /> Edit</button>
          <button type="button" className="btn-secondary" onClick={() => setStatusOpen(true)}>Change status</button>
        </div>} />

      <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
        <Badge status={trip.status} />
        <span>{fmtDate(trip.start_date)}{trip.actual_end_date ? ` – ${fmtDate(trip.actual_end_date)}` : ''}</span>
        <span>· {trip.company_name || 'No company'}</span>
        <span>· {trip.driver_name || 'No driver'}</span>
        {trip.cargo && <span>· {trip.cargo}{trip.quantity ? ` (${trip.quantity} t)` : ''}</span>}
        {trip.km != null && <span>· {trip.km} km</span>}
      </div>
      {trip.cancel_reason && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">Cancelled: {trip.cancel_reason}</p>
      )}
      {trip.notes && <p className="mb-4 text-sm text-zinc-500">{trip.notes}</p>}

      {/* Financial summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Profit" value={inr(trip.profit)} tone={Number(trip.profit) >= 0 ? 'positive' : 'negative'} />
        <StatTile label="Income" value={inr(trip.income)} />
        <StatTile label="Owner cost" value={inr(trip.owner_cost)} />
        <StatTile label="Pending" value={inr(trip.pending)} tone={Number(trip.pending) > 0 ? 'negative' : 'default'} />
        <StatTile label="Freight" value={inr(trip.freight_amount)} />
        <StatTile label="Company diesel" value={inr(trip.company_diesel)}
          hint={trip.deduct_company_diesel ? 'deducted from freight' : 'not deducted'} />
        <StatTile label="Received" value={inr(trip.received)} />
        <StatTile label="Diesel (L)" value={String(trip.diesel_litres || 0)} />
      </div>

      {/* Expenses */}
      <section className="card mb-6 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-700">Expenses</h3>
          <button type="button" className="btn-primary" onClick={() => { setEditExp(null); setExpOpen(true); }}><Plus size={15} /> Add expense</button>
        </div>
        {trip.expenses.length === 0 ? <p className="text-sm text-zinc-400">No expenses yet.</p> : (
          <ul className="divide-y divide-zinc-100">
            {trip.expenses.map((e) => {
              const free = e.paid_by === 'company' && e.category === 'diesel' && !trip.deduct_company_diesel;
              return (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">{titleCase(e.category)}</span>
                    {e.category === 'diesel' && (
                      <span className="text-zinc-400">
                        {e.litres != null && ` · ${e.litres}L`}{e.rate != null && ` @ ${inr(e.rate)}`}{e.fill_location && ` · ${e.fill_location}`}
                      </span>
                    )}
                    {e.work_detail && <span className="text-zinc-400"> · {e.work_detail}</span>}
                    <div className="text-xs text-zinc-400">
                      {fmtDate(e.expense_date)} · paid by {e.paid_by}{e.vendor_name ? ` · ${e.vendor_name}` : ''}{e.note ? ` · ${e.note}` : ''}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 text-right tabular-nums">
                      {inr(e.amount)}
                      {free && <span className="block text-xs text-zinc-400">free</span>}
                    </span>
                    <button type="button" className="icon-btn" aria-label="Edit expense" onClick={() => { setEditExp(e); setExpOpen(true); }}><Pencil size={14} /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete expense"
                      onClick={() => setPendingDel({ kind: 'expense', id: e.id, label: `${titleCase(e.category)} of ${inr(e.amount)}` })}><Trash2 size={14} /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Payments received */}
      <section className="card mb-6 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-700">Payments received</h3>
          <button type="button" className="btn-secondary" onClick={() => setPayOpen(true)}><Plus size={15} /> Add payment</button>
        </div>
        {trip.payments.length === 0 ? <p className="text-sm text-zinc-400">Nothing received yet.</p> : (
          <ul className="divide-y divide-zinc-100">
            {trip.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{fmtDate(p.payment_date)} · <span className="uppercase text-zinc-500">{p.mode || '—'}</span>{p.note ? <span className="text-zinc-400"> · {p.note}</span> : null}</span>
                <div className="flex items-center gap-1">
                  <span className="mr-1 tabular-nums text-emerald-600">{inr(p.amount)}</span>
                  <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete payment"
                    onClick={() => setPendingDel({ kind: 'payment', id: p.id, label: `payment of ${inr(p.amount)}` })}><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button type="button" className="btn-ghost text-red-600 hover:bg-red-50" onClick={() => setPendingDel({ kind: 'trip' })}><Trash2 size={15} /> Delete trip</button>

      {/* Modals (each form mounts fresh when its modal opens) */}
      <Modal open={expOpen} onClose={() => setExpOpen(false)} title={editExp ? 'Edit expense' : 'Add expense'}>
        <ExpenseForm tripId={trip.id} tripHasDriver={!!trip.driver_id} tripCompanyId={trip.company_id}
          deductsDiesel={trip.deduct_company_diesel}
          initial={editExp} onSaved={() => { setExpOpen(false); mutate(); }} />
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Add payment received">
        <PaymentForm tripId={trip.id} pending={Number(trip.pending) || 0} onSaved={() => { setPayOpen(false); mutate(); }} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit trip">
        <TripForm initial={trip} onSaved={() => { setEditOpen(false); mutate(); }} />
      </Modal>

      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title="Change status">
        <StatusForm trip={trip} onSaved={() => { setStatusOpen(false); mutate(); }} />
      </Modal>

      <ConfirmDialog open={!!pendingDel} onClose={() => setPendingDel(null)} onConfirm={confirmDelete}
        title={pendingDel?.kind === 'trip' ? 'Delete this trip?' : `Delete ${pendingDel?.kind ?? ''}?`}
        message={pendingDel?.kind === 'trip'
          ? 'This permanently removes the trip and all its expenses and payments. This cannot be undone.'
          : `This removes the ${pendingDel?.label ?? 'entry'} and updates the trip totals.`} />
    </>
  );
}

/* ---- Payment form ---- */
function PaymentForm({ tripId, pending, onSaved }: { tripId: number; pending: number; onSaved: () => void }) {
  const [amount, setAmount] = useState(pending > 0 ? String(pending) : '');
  const [payment_date, setDate] = useState(today);
  const [mode, setMode] = useState('');
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
        <input type="number" inputMode="decimal" min={0} step="any" className="input" required value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" className="input" required value={payment_date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Mode">
          <Select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">—</option><option value="cash">Cash</option><option value="upi">UPI</option>
            <option value="bank">Bank</option><option value="card">Card</option>
          </Select>
        </Field>
      </div>
      <Field label="Note"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Add payment'}</button></div>
    </form>
  );
}

/* ---- Status form (mirrors the backend's completion & cancel rules) ---- */
function StatusForm({ trip, onSaved }: { trip: Trip; onSaved: () => void }) {
  const [status, setStatus] = useState<Status>(trip.status);
  const [actual_end_date, setEndDate] = useState(trip.actual_end_date || today());
  const [actual_end_location, setEndLoc] = useState(str(trip.actual_end_location || trip.expected_end_location));
  const [end_odometer, setOdo] = useState(str(trip.end_odometer));
  const [cancel_reason, setReason] = useState(str(trip.cancel_reason));
  const [loading, setLoading] = useState(false);

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
      <Field label="Status">
        <Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="scheduled">Scheduled</option><option value="running">Running</option>
          <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
        </Select>
      </Field>
      {status === 'completed' && (<>
        <Field label="Actual end date" required>
          <input type="date" className="input" required min={trip.start_date} value={actual_end_date} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
        <Field label="Actual end location">
          <input className="input" value={actual_end_location} onChange={(e) => setEndLoc(e.target.value)} />
        </Field>
        <Field label="End odometer (km)" required hint={trip.start_odometer != null ? `Start was ${trip.start_odometer} km.` : undefined}>
          <input type="number" inputMode="numeric" className="input" required min={trip.start_odometer ?? 0}
            value={end_odometer} onChange={(e) => setOdo(e.target.value)} />
        </Field>
      </>)}
      {status === 'cancelled' && (
        <Field label="Reason" required>
          <input className="input" required value={cancel_reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      )}
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}
