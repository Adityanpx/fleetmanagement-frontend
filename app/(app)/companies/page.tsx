'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, Building2, Phone, User, Fuel } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { inr, pct, str, orNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Company } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import Switch from '@/components/ui/Switch';
import Avatar from '@/components/ui/Avatar';
import SearchInput from '@/components/ui/SearchInput';
import { SkeletonList } from '@/components/ui/Skeleton';

interface CompanyStats { id: number; trips: number; freight: number; income: number; received: number; pending: number; diesel_given: number }

export default function CompaniesPage() {
  const { data, error, isLoading, mutate } = useSWR<Company[]>('/companies', fetcher);
  const { data: stats } = useSWR<{ rows: CompanyStats[] }>('/reports/companies', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Company | null>(null);
  const [del, setDel] = useState<Company | null>(null);
  const [q, setQ] = useState('');

  const remove = async () => { if (del && await removeRecord(`/companies/${del.id}`, 'Company')) mutate(); };
  const byId = useMemo(() => new Map((stats?.rows ?? []).map((r) => [r.id, r])), [stats]);
  const shown = (data ?? []).filter((c) => !q || [c.name, c.contact_person, c.phone].some((x) => x?.toLowerCase().includes(q.toLowerCase())));
  const totalPending = (stats?.rows ?? []).reduce((a, r) => a + Number(r.pending || 0), 0);

  return (
    <>
      <PageHeader title="Companies" subtitle={stats ? `${inr(totalPending)} pending across all companies` : 'Who you haul for'}
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add company</button>} />

      {data && data.length > 0 && <SearchInput value={q} onChange={setQ} placeholder="Search company or contact…" className="mb-5 sm:w-80" />}

      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <SkeletonList rows={3} /> : !data || data.length === 0 ? (
        <EmptyState icon={Building2} title="No companies yet" hint="Companies are who you haul for. Each one can deduct its diesel from freight by default." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((c, i) => {
            const s = byId.get(c.id);
            const income = Number(s?.income || 0);
            const received = Number(s?.received || 0);
            const pending = Number(s?.pending || 0);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 9) * 0.04 }}
                className={cn('card card-hover group flex flex-col p-5', !c.is_active && 'opacity-60')}>
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} seed={`c${c.id}`} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">{c.name} {!c.is_active && <InactiveBadge />}</p>
                    <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                      {c.contact_person && <span className="flex items-center gap-1"><User size={11} />{c.contact_person}</span>}
                      {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-indigo-600 hover:underline"><Phone size={11} />{c.phone}</a>}
                      {!c.contact_person && !c.phone && 'No contact saved'}
                    </p>
                  </div>
                  <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                    <button type="button" className="icon-btn" aria-label="Edit company" onClick={() => { setEdit(c); setOpen(true); }}><Pencil size={15} /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete company" onClick={() => setDel(c)}><Trash2 size={15} /></button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={cn('chip', c.deduct_diesel_default ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600')}>
                    <Fuel size={12} />{c.deduct_diesel_default ? 'Diesel deducted' : 'Diesel free'}
                  </span>
                  <span className="chip bg-zinc-100 text-zinc-600">{s?.trips ?? 0} trips</span>
                </div>

                <div className="mt-4 rounded-xl bg-zinc-50 p-3">
                  <div className="mb-1.5 flex items-baseline justify-between text-xs">
                    <span className="text-zinc-500">Received <b className="text-zinc-800">{inr(received)}</b> of {inr(income)}</span>
                    <span className="text-zinc-400">{pct(received, income).toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200/70">
                    <motion.div className="h-full rounded-full bg-emerald-500" initial={{ width: 0 }} animate={{ width: `${pct(received, income)}%` }}
                      transition={{ duration: 0.9, delay: 0.2 }} />
                  </div>
                  <p className={cn('mt-2 text-sm font-semibold tabular-nums', pending > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                    {pending > 0 ? `${inr(pending)} pending` : income > 0 ? 'All paid ✓' : 'No billed trips yet'}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? `Edit ${edit.name}` : 'Add company'}>
        <CompanyForm initial={edit} onSaved={() => { setOpen(false); mutate(); }} />
      </Modal>
      <ConfirmDialog open={!!del} onClose={() => setDel(null)} onConfirm={remove}
        title={`Delete ${del?.name ?? 'company'}?`} message="If it has trips, it is only deactivated to keep history intact." />
    </>
  );
}

function CompanyForm({ initial, onSaved }: { initial: Company | null; onSaved: () => void }) {
  const [f, setF] = useState({
    name: str(initial?.name), contact_person: str(initial?.contact_person), phone: str(initial?.phone),
    deduct_diesel_default: initial?.deduct_diesel_default ?? false, is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    const payload = {
      name: f.name.trim(), contact_person: orNull(f.contact_person.trim()), phone: orNull(f.phone.trim()),
      deduct_diesel_default: f.deduct_diesel_default,
      ...(initial ? { is_active: f.is_active } : {}),
    };
    try {
      if (initial) await api.put(`/companies/${initial.id}`, payload); else await api.post('/companies', payload);
      toast.success('Saved'); onSaved();
    } catch (err) { toast.error((err as Error).message); setLoading(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" required><input className="input" required value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact person"><input className="input" value={f.contact_person} onChange={(e) => set('contact_person', e.target.value)} /></Field>
        <Field label="Phone"><input type="tel" inputMode="tel" className="input" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
      </div>
      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
        <Switch checked={f.deduct_diesel_default} onChange={(v) => set('deduct_diesel_default', v)}
          label="Deduct company diesel from freight by default"
          description="New trips for this company start with this setting. You can change it per trip." />
      </div>
      {initial && <Switch checked={f.is_active} onChange={(v) => set('is_active', v)} label="Active" description="Inactive companies are hidden when creating trips." />}
      <button className="btn-primary w-full" disabled={loading}>{loading ? 'Saving…' : 'Save company'}</button>
    </form>
  );
}
