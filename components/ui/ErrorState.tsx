export default function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="font-medium text-red-600">Couldn&apos;t load this</p>
      <p className="max-w-sm text-sm text-zinc-500">{error.message}</p>
      {onRetry && <button type="button" className="btn-secondary mt-2" onClick={onRetry}>Try again</button>}
    </div>
  );
}
