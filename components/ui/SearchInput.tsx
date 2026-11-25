'use client';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/format';

export default function SearchInput({ value, onChange, placeholder = 'Search…', className }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="input h-10 py-0 pl-9 pr-9" type="search" />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')}
          className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
