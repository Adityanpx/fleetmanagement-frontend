import { cn, initials } from '@/lib/format';
import { avatarTint } from '@/lib/meta';

export default function Avatar({ name, seed, size = 'md', icon }: {
  name: string; seed?: string | number; size?: 'sm' | 'md' | 'lg'; icon?: React.ReactNode;
}) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-xl font-semibold', avatarTint(seed ?? name),
      size === 'sm' && 'h-8 w-8 text-xs', size === 'md' && 'h-10 w-10 text-sm', size === 'lg' && 'h-12 w-12 text-base')}>
      {icon ?? initials(name)}
    </span>
  );
}
