'use client';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/format';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

type Tone = 'default' | 'positive' | 'negative';

/**
 * KPI card. `delta` is a fraction (0.12 = +12%) vs the previous period;
 * `upIsGood` decides whether a rise is colored green or red.
 */
export default function StatTile({
  label, value, format, tone = 'default', hint, icon: Icon, iconTint = 'bg-zinc-100 text-zinc-600',
  delta, upIsGood = true, trend, trendColor,
}: {
  label: string; value: number; format: (n: number) => string; tone?: Tone; hint?: string;
  icon?: LucideIcon; iconTint?: string; delta?: number | null; upIsGood?: boolean;
  trend?: number[]; trendColor?: string;
}) {
  const showDelta = delta != null && Number.isFinite(delta);
  const up = (delta ?? 0) >= 0;
  const good = up === upIsGood;
  return (
    <div className="card card-hover group relative overflow-hidden p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium text-zinc-500">{label}</p>
        {Icon && (
          <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', iconTint)}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <AnimatedNumber value={value} format={format}
        className={cn('mt-1 block text-[clamp(1.05rem,5.4vw,1.5rem)] font-semibold tracking-tight tabular-nums lg:text-2xl',
          tone === 'positive' && 'text-emerald-600', tone === 'negative' && 'text-red-600')} />
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0 text-xs">
          {showDelta ? (
            <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
              delta === 0 ? 'bg-zinc-100 text-zinc-500' : good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
              {delta !== 0 && (up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}
              {Math.abs(delta! * 100) >= 1000 ? '999+' : Math.abs(delta! * 100).toFixed(Math.abs(delta!) < 0.1 ? 1 : 0)}%
            </span>
          ) : null}
          {hint && <span className={cn('text-zinc-400', showDelta && 'ml-1.5')}>{hint}</span>}
        </div>
        {trend && trend.length > 1 && <Sparkline data={trend} color={trendColor} className="-mb-1 h-8 w-20 shrink-0" />}
      </div>
    </div>
  );
}
