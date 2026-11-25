import { cn } from '@/lib/format';

export default function StatTile({
  label, value, tone = 'default', hint,
}: { label: string; value: string; tone?: 'default' | 'positive' | 'negative'; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums sm:text-2xl',
        tone === 'positive' && 'text-emerald-600',
        tone === 'negative' && 'text-red-600')}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
