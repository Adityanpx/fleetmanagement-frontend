'use client';
import { inr } from '@/lib/format';

interface Item { name?: string | number; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> }
export interface TooltipProps {
  active?: boolean; payload?: readonly Item[]; label?: string | number;
  labelFormatter?: (l: string) => string;
  names?: Record<string, string>;
  /** Extra rows computed from the hovered datum, e.g. profit = income - cost. */
  extra?: (d: Record<string, unknown>) => { label: string; value: number; tone?: 'pos' | 'neg' }[];
  valueFormat?: (n: number) => string;
}

/** Shared tooltip: swatch beside each series, values in text ink (never the series color). */
export default function ChartTooltip({ active, payload, label, labelFormatter, names, extra, valueFormat = inr }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const datum = (payload[0]?.payload ?? {}) as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-xl border border-zinc-200 bg-white/95 px-3 py-2.5 text-xs shadow-pop backdrop-blur">
      {label !== undefined && <p className="mb-1.5 font-semibold text-zinc-800">{labelFormatter ? labelFormatter(String(label)) : label}</p>}
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {names?.[String(p.dataKey)] ?? p.name}
            </span>
            <span className="font-medium tabular-nums text-zinc-900">{valueFormat(Number(p.value))}</span>
          </div>
        ))}
        {extra?.(datum).map((e) => (
          <div key={e.label} className="mt-1 flex items-center justify-between gap-4 border-t border-zinc-100 pt-1">
            <span className="text-zinc-500">{e.label}</span>
            <span className={`font-semibold tabular-nums ${e.tone === 'neg' ? 'text-red-600' : e.tone === 'pos' ? 'text-emerald-600' : 'text-zinc-900'}`}>{valueFormat(e.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
