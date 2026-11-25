import { cn } from '@/lib/format';

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('input', className)} {...props}>{children}</select>;
}
