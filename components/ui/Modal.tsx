'use client';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode;
}) {
  // Keep the latest onClose without re-running the effect when callers pass inline functions.
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
         onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title}
           className="w-full max-w-lg rounded-t-2xl bg-white shadow-pop sm:rounded-2xl"
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h3 className="text-base font-semibold">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn -mr-2"><X size={18} /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
