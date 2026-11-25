'use client';
import { useId } from 'react';
import { motion } from 'motion/react';

/** Tiny trend line: 2px line, 10% area wash, end dot with a surface ring. Draws itself in. */
export default function Sparkline({ data, color = '#6366f1', className = 'h-9 w-24' }: {
  data: number[]; color?: string; className?: string;
}) {
  const gid = useId();
  if (data.length < 2) return null;
  const W = 96, H = 36, P = 4;
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => [P + (i / (data.length - 1)) * (W - 2 * P), H - P - ((v - min) / span) * (H - 2 * P)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts.at(-1)![0]},${H} L${pts[0][0]},${H} Z`;
  const [ex, ey] = pts.at(-1)!;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gid})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} />
      <motion.path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
      <motion.circle cx={ex} cy={ey} r={3.5} fill={color} stroke="#fff" strokeWidth={2}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.9, type: 'spring' }} />
    </svg>
  );
}
