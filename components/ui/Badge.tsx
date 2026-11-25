import { cn } from '@/lib/format';
import { STATUS_META } from '@/lib/meta';
import type { Status } from '@/lib/types';

/** Status pill: dot + label (never color alone). Running trips get a live pulse. */
export default function Badge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', m.pill, className)}>
      <span className="relative flex h-1.5 w-1.5">
        {status === 'running' && <span className={cn('absolute inline-flex h-full w-full rounded-full animate-ping-slow', m.dot)} />}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', m.dot)} />
      </span>
      {m.label}
    </span>
  );
}

export function InactiveBadge() {
  return <span className="chip bg-zinc-100 py-0.5 text-zinc-500 ring-1 ring-inset ring-zinc-200">Inactive</span>;
}
