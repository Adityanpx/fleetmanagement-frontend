'use client';
import { motion } from 'motion/react';
import { cn } from '@/lib/format';

/** Accessible toggle switch with a sprung knob; label and description sit beside it. */
export default function Switch({ checked, onChange, label, description, className }: {
  checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; description?: React.ReactNode; className?: string;
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'justify-end bg-indigo-600' : 'justify-start bg-zinc-300')}>
        <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 35 }}
          className="h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.25)]" />
      </button>
      <span className="text-sm">
        <span className="font-medium text-zinc-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>}
      </span>
    </label>
  );
}
