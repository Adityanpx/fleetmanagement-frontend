export default function EmptyState({ title, hint, action }: {
  title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="font-medium text-zinc-700">{title}</p>
      {hint && <p className="max-w-sm text-sm text-zinc-400">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
