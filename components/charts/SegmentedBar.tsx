'use client';
import { useState } from 'react';
import { motion } from 'motion/react';
import { cn, inr } from '@/lib/format';

export interface Segment { key: string; label: string; value: number; color: string; icon?: React.ReactNode }

/**
 * One whole split into parts: a single bar of segments with 2px surface gaps, plus a legend
 * that carries label, value and share (identity never relies on color alone).
 * Hovering a segment or a legend row highlights the pair.
 */
export default function SegmentedBar({ segments, format = inr, legend = 'list', thick = false }: {
  segments: Segment[]; format?: (n: number) => string; legend?: 'list' | 'inline'; thick?: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const parts = segments.filter((s) => s.value > 0);
  const total = parts.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return <p className="py-6 text-center text-sm text-zinc-400">No data for this period.</p>;

  return (
    <div>
      <div className={cn('flex w-full gap-[2px] overflow-hidden rounded-full', thick ? 'h-4' : 'h-3')}>
        {parts.map((s, i) => (
          <motion.div key={s.key} title={`${s.label}: ${format(s.value)}`}
            initial={{ width: 0 }} animate={{ width: `${(s.value / total) * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
            className="h-full min-w-[3px] transition-opacity first:rounded-l-full last:rounded-r-full"
            style={{ background: s.color, opacity: hover && hover !== s.key ? 0.3 : 1 }} />
        ))}
      </div>
      {legend === 'list' ? (
        <ul className="mt-4 space-y-0.5">
          {parts.map((s) => (
            <li key={s.key} onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}
              className={cn('flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors',
                hover === s.key ? 'bg-zinc-50' : '')}>
              <span className="flex min-w-0 items-center gap-2.5 text-zinc-600">
                <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                {s.icon}
                <span className="truncate">{s.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                <span className="font-medium text-zinc-900">{format(s.value)}</span>
                <span className="w-10 text-right text-xs text-zinc-400">{((s.value / total) * 100).toFixed(0)}%</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-500">
          {parts.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5" onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(null)}>
              <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color }} />
              {s.label} <span className="font-medium tabular-nums text-zinc-800">{format(s.value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
