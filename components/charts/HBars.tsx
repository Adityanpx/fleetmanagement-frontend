'use client';
import { motion } from 'motion/react';
import { cn, inr } from '@/lib/format';
import { POSITIVE, NEGATIVE } from '@/lib/meta';

export interface HBarRow { key: string | number; label: string; sub?: string; value: number; display?: string }

/**
 * Ranked horizontal bars (magnitude). `signed` colors gains green and losses red;
 * otherwise one hue. Value sits at the tip in text ink.
 */
export default function HBars({ rows, format = inr, signed = false, color = '#6366f1', empty = 'No data for this period.', limit }: {
  rows: HBarRow[]; format?: (n: number) => string; signed?: boolean; color?: string; empty?: string; limit?: number;
}) {
  const shown = limit ? rows.slice(0, limit) : rows;
  if (shown.length === 0) return <p className="py-6 text-center text-sm text-zinc-400">{empty}</p>;
  const max = Math.max(1, ...shown.map((r) => Math.abs(r.value)));
  return (
    <ul className="space-y-3">
      {shown.map((r, i) => {
        const fill = signed ? (r.value >= 0 ? POSITIVE : NEGATIVE) : color;
        return (
          <li key={r.key} className="group">
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-zinc-700">
                {r.label}{r.sub && <span className="ml-1.5 text-xs text-zinc-400">{r.sub}</span>}
              </span>
              <span className={cn('shrink-0 font-medium tabular-nums', signed && r.value < 0 ? 'text-red-600' : 'text-zinc-900')}>
                {r.display ?? format(r.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100">
              <motion.div className="h-2 rounded-full transition-[filter] group-hover:brightness-110"
                initial={{ width: 0 }} animate={{ width: `${Math.max(1.5, (Math.abs(r.value) / max) * 100)}%` }}
                transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: fill }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
