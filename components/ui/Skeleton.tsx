import { cn } from '@/lib/format';

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} />;
}

export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="flex items-center justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-8 rounded-xl" /></div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/3" /><Skeleton className="h-3 w-1/2" /></div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn('card p-5', className)}>
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-5 h-3 w-24" />
      <div className="flex h-48 items-end gap-3">
        {[40, 65, 50, 80, 60, 90, 70].map((h, i) => <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />)}
      </div>
    </div>
  );
}
