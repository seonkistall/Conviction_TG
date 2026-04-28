'use client';

import { animate, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface Props {
  target: number;
  durationMs?: number;
  decimals?: number;
  locale?: string;
}

export function AnimatedNumber({
  target,
  durationMs = 1400,
  decimals,
  locale = 'en-US',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setValue(target);
      return;
    }
    const controls = animate(0, target, {
      duration: durationMs / 1000,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (latest) => setValue(latest),
    });
    return () => controls.stop();
  }, [inView, target, durationMs]);

  const text =
    decimals !== undefined
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString(locale);
  return <span ref={ref}>{text}</span>;
}
