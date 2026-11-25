'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/format';
import { usePhone } from '@/lib/useMediaQuery';

export interface DropOption { value: string; label: string; hint?: string }

/**
 * A filter chip that opens a searchable option list:
 * a popover on tablet/desktop, a bottom sheet with large tap rows on phones.
 */
export default function Dropdown({ label, value, options, onChange, icon, allLabel = 'All', className }: {
  label: string; value: string; options: DropOption[]; onChange: (v: string) => void;
  icon?: React.ReactNode; allLabel?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const phone = usePhone();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!phone && !ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    if (phone) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, phone]);

  const selected = options.find((o) => o.value === value);
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const pick = (v: string) => { onChange(v); setOpen(false); setQ(''); };

  const list = (
    <ul className={cn('overflow-y-auto overscroll-contain p-1', phone ? 'max-h-[55dvh] pb-[calc(0.5rem+env(safe-area-inset-bottom))]' : 'max-h-64')}>
      <Item big={phone} active={!value} onClick={() => pick('')}>{allLabel}</Item>
      {shown.map((o) => (
        <Item key={o.value} big={phone} active={o.value === value} onClick={() => pick(o.value)} hint={o.hint}>{o.label}</Item>
      ))}
      {shown.length === 0 && <li className="px-3 py-3 text-sm text-zinc-400">No matches</li>}
    </ul>
  );
  const search = options.length > 6 && (
    <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
      <Search size={15} className="text-zinc-400" />
      <input autoFocus={!phone} value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
        className="w-full bg-transparent py-1 text-base outline-none placeholder:text-zinc-400 sm:text-sm" />
    </div>
  );

  return (
    <div ref={ref} className={cn('relative min-w-0', className)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox"
        className={cn('flex h-10 w-full min-w-0 items-center gap-2 rounded-xl border px-3 text-sm transition sm:h-9 sm:w-auto',
          selected ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50')}>
        <span className="shrink-0">{icon}</span>
        {/* Phones: just the value (or the filter's name when unset) so it never truncates to "Company A…" */}
        <span className="hidden shrink-0 text-zinc-400 sm:inline">{label}</span>
        <span className="min-w-0 flex-1 truncate text-left font-medium sm:max-w-[9rem] sm:flex-none">
          <span className="sm:hidden">{selected ? selected.label : <span className="font-normal text-zinc-500">{label}</span>}</span>
          <span className="hidden sm:inline">{selected ? selected.label : allLabel}</span>
        </span>
        <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Tablet / desktop popover */}
      <AnimatePresence>
        {open && !phone && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="absolute left-0 z-40 mt-2 w-60 origin-top-left overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-pop">
            {search}{list}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone bottom sheet, portalled so no scroll container can clip it */}
      {phone && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[60] bg-zinc-950/40 backdrop-blur-[2px]" onClick={() => setOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div role="listbox" aria-label={label} onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-3xl bg-white shadow-pop"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 420, damping: 38 }}>
                <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-200" />
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <span className="font-semibold">{label}</span>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="icon-btn -mr-2"><X size={18} /></button>
                </div>
                {search}{list}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function Item({ active, onClick, children, hint, big }: { active: boolean; onClick: () => void; children: React.ReactNode; hint?: string; big?: boolean }) {
  return (
    <li>
      <button type="button" onClick={onClick}
        className={cn('flex w-full items-center justify-between gap-2 rounded-lg px-3 text-left transition',
          big ? 'min-h-12 text-base' : 'py-2 text-sm',
          active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100')}>
        <span className="truncate">{children}{hint && <span className="ml-1.5 text-xs text-zinc-400">{hint}</span>}</span>
        {active && <Check size={16} className="shrink-0" />}
      </button>
    </li>
  );
}
