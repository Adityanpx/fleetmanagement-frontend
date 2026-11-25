'use client';
import { useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, fetcher } from '@/lib/api';
import { str, orNull, cn } from '@/lib/format';
import { removeRecord } from '@/lib/remove';
import type { Company } from '@/lib/types';
import PageHeader from '@/components/ui/PageHeader';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { InactiveBadge } from '@/components/ui/Badge';
import { Field } from '@/components/ui/Field';
import ActiveToggle from '@/components/ActiveToggle';

export default function CompaniesPage() {
  const { data, error, isLoading, mutate } = useSWR<Company[]>('/companies', fetcher);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Company | null>(null);
  const [del, setDel] = useState<Company | null>(null);

  const remove = async () => { if (del && await removeRecord(`/companies/${del.id}`, 'Company')) mutate(); };

  return (
    <>
      <PageHeader title="Companies"
        action={<button type="button" className="btn-primary" onClick={() => { setEdit(null); setOpen(true); }}><Plus size={16} /> Add company</button>} />
      {error ? <ErrorState error={error} onRetry={() => mutate()} /> : isLoading ? <Spinner /> : !data || data.length === 0 ? (
        <EmptyState title="No companies yet" hint="Companies are who you haul for. Each one can deduct its diesel from freight by default." />
      ) : (
        <div className="space-y-2">
          {data.map((c) => (
            <div key={c.id} className={cn('card flex flex-wrap items-center justify-between gap-3 p-4', !c.is_active && 'opacity-60')}>
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">{c.name} {!c.is_active && <InactiveBadge />}</p>
                <p className="text-xs text-zinc-400">{c.contact_person || '—'} · {c.phone || '—'}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="mr-2 text-xs text-zinc-500">{c.deduct_diesel_default ? 'Diesel deducted' : 'Diesel free'}</span>
                <button type="button" className="icon-btn" aria-label="Edit company" onClick={() => { setEdit(c); setOpen(true); }}><Pencil size={15} /></button>
                <button type="button" className="icon-btn hover:text-red-600" aria-label="Delete company" onClick={() => setDel(c)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title={edit ? 'Edit company' : 'Add company'}>
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
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-zinc-900" checked={f.deduct_diesel_default}
          onChange={(e) => set('deduct_diesel_default', e.target.checked)} />
        <span>By default, deduct company diesel from freight
          <span className="block text-xs text-zinc-400">New trips for this company start with this setting. You can change it per trip.</span></span>
      </label>
      {initial && <ActiveToggle checked={f.is_active} onChange={(v) => set('is_active', v)} />}
      <div className="flex justify-end"><button className="btn-primary w-full sm:w-auto" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button></div>
    </form>
  );
}
