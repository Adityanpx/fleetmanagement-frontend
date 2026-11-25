import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><TriangleAlert size={22} /></span>
      <p className="font-semibold text-zinc-800">Couldn&apos;t load this</p>
      <p className="max-w-sm text-sm text-zinc-500">{error.message}</p>
      {onRetry && <button type="button" className="btn-secondary mt-2" onClick={onRetry}><RefreshCw size={14} /> Try again</button>}
    </div>
  );
}
