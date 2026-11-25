'use client';
import { motion, type Variants } from 'motion/react';

export const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

/** Children wrapped in <StaggerItem> fade up one after another. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={container} initial="hidden" animate="show">{children}</motion.div>;
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} variants={item}>{children}</motion.div>;
}

export function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease, delay }}>
      {children}
    </motion.div>
  );
}
