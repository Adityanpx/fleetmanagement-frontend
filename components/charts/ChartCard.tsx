import { cn } from '@/lib/format';

export default function ChartCard({ title, subtitle, action, children, className }: {
  title: string; subtitle?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={cn('card p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="card-sub mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
