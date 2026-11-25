'use client';
import { motion } from 'motion/react';

export default function PageHeader({ title, subtitle, action, eyebrow }: {
  title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; eyebrow?: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wider text-indigo-600">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </motion.div>
  );
}
