'use client';
import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'motion/react';

/** Counts from the previous value to the new one. Writes to the DOM directly (no re-render per frame). */
export default function AnimatedNumber({ value, format, className }: {
  value: number; format: (n: number) => string; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduce = useReducedMotion();
  const fmt = useRef(format);
  useEffect(() => { fmt.current = format; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = fmt.current(value); prev.current = value; return; }
    const controls = animate(prev.current, value, {
      duration: 0.9, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { el.textContent = fmt.current(v); },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return <span ref={ref} className={className}>{format(0)}</span>;
}
