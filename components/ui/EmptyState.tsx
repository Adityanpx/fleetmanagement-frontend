'use client';
import { motion } from 'motion/react';
import { Inbox, type LucideIcon } from 'lucide-react';

export default function EmptyState({ title, hint, action, icon: Icon = Inbox }: {
  title: string; hint?: string; action?: React.ReactNode; icon?: LucideIcon;
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
      className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="relative mb-2">
        <div className="absolute inset-0 rounded-2xl bg-indigo-200/40 blur-xl" />
        <div className="relative grid h-14 w-14 animate-float place-items-center rounded-2xl bg-linear-to-br from-white to-zinc-100 text-zinc-500 shadow-lift ring-1 ring-zinc-200">
          <Icon size={24} />
        </div>
      </div>
      <p className="font-semibold text-zinc-800">{title}</p>
      {hint && <p className="max-w-sm text-sm text-zinc-500">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </motion.div>
  );
}
