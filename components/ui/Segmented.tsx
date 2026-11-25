'use client';
import { useEffect, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/format';

export interface SegOption<T extends string> { value: T; label: React.ReactNode; count?: number; icon?: React.ReactNode }

/**
 * Pill switch with a sliding highlight. `size="sm"` for inline form use.
 * `full` stretches options to fill the row; with `fullOnPhoneOnly` that happens on phones only.
 * If the options don't fit they scroll sideways (no visible bar) and the active one is kept in view.
 */
export default function Segmented<T extends string>({ value, onChange, options, className, size = 'md', full, fullOnPhoneOnly }: {
  value: T; onChange: (v: T) => void; options: SegOption<T>[]; className?: string; size?: 'sm' | 'md';
  full?: boolean; fullOnPhoneOnly?: boolean;
}) {
  const id = useId();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [value]);

  const stretch = full && fullOnPhoneOnly ? 'flex w-full sm:inline-flex sm:w-auto' : full ? 'flex w-full' : 'inline-flex';
  const grow = full && fullOnPhoneOnly ? 'flex-1 sm:flex-none' : full ? 'flex-1' : '';

  return (
    <div ref={listRef} role="tablist"
      className={cn('no-scrollbar max-w-full gap-0.5 overflow-x-auto rounded-xl bg-zinc-100/80 p-1 ring-1 ring-inset ring-zinc-200/60', stretch, className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cn('relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-2 text-xs sm:py-1.5' : 'px-3 py-2 text-sm sm:py-1.5',
              grow,
              active ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-800')}>
            {active && (
              <motion.span layoutId={`seg-${id}`} className="absolute inset-0 rounded-lg bg-white shadow-[0_1px_3px_rgb(16_24_40/0.12)] ring-1 ring-zinc-200/70"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }} />
            )}
            <span className="relative flex items-center gap-1.5">
              {o.icon}{o.label}
              {o.count !== undefined && (
                <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-zinc-900 text-white' : 'bg-zinc-200/80 text-zinc-600')}>{o.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
