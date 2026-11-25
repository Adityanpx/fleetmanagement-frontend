import { cn } from '@/lib/format';
import type { Status } from '@/lib/types';

const map: Record<Status, string> = {
  scheduled: 'bg-zinc-100 text-zinc-600',
  running: 'bg-blue-50 text-blue-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function Badge({ status }: { status: Status }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', map[status])}>
      {status}
    </span>
  );
}

export function InactiveBadge() {
  return <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500">Inactive</span>;
}
