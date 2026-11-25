'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/format';

export interface DropOption { value: string; label: string; hint?: string }

/** A filter chip that opens an animated, searchable option list. */
export default function Dropdown({ label, value, options, onChange, icon, allLabel = 'All' }: {
  label: string; value: string; options: DropOption[]; onChange: (v: string) => void;
  icon?: React.ReactNode; allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase()));
  const pick = (v: string) => { onChange(v); setOpen(false); setQ(''); };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className={cn('flex h-9 items-center gap-2 rounded-xl border px-3 text-sm transition',
          selected ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50')}>
        {icon}
        <span className="text-zinc-400">{label}</span>
        <span className="max-w-[9rem] truncate font-medium">{selected ? selected.label : allLabel}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.15 }}
            className="absolute left-0 z-40 mt-2 w-60 origin-top-left overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-pop">
            {options.length > 6 && (
              <div className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2">
                <Search size={14} className="text-zinc-400" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${label.toLowerCase()}…`}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400" />
              </div>
            )}
            <ul className="max-h-64 overflow-y-auto p-1">
              <Item active={!value} onClick={() => pick('')}>{allLabel}</Item>
              {shown.map((o) => (
                <Item key={o.value} active={o.value === value} onClick={() => pick(o.value)} hint={o.hint}>{o.label}</Item>
              ))}
              {shown.length === 0 && <li className="px-3 py-2 text-sm text-zinc-400">No matches</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Item({ active, onClick, children, hint }: { active: boolean; onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <li>
      <button type="button" onClick={onClick}
        className={cn('flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
          active ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-700 hover:bg-zinc-50')}>
        <span className="truncate">{children}{hint && <span className="ml-1.5 text-xs text-zinc-400">{hint}</span>}</span>
        {active && <Check size={14} />}
      </button>
    </li>
  );
}
