'use client';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';

/** Centered dialog on desktop, bottom sheet on phones. Animates in and out. */
export default function Modal({ open, onClose, title, subtitle, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="backdrop" className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={onClose}>
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            className={`flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-pop sm:rounded-2xl ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
            initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-4 sm:pt-5">
              <div>
                <h3 className="text-base font-semibold tracking-tight">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="icon-btn -mr-2 -mt-1"><X size={18} /></button>
            </div>
            <div className="overscroll-contain overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
