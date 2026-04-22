'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks short-lived price changes so a UI element can flash green / red
 * for ~600ms whenever the value moves. The hook returns a `direction`
 * that is `null` most of the time and 'up' | 'down' for the brief window
 * after each change.
 *
 * Respects `prefers-reduced-motion` automatically — the direction will
 * still flip, but the consumer should pair this with a CSS class that
 * is itself a no-op under reduced motion.
 */
export function usePriceFlicker(value: number, ms = 600): 'up' | 'down' | null {
  const prev = useRef(value);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value === prev.current) return;
    setDir(value > prev.current ? 'up' : 'down');
    prev.current = value;
    const t = window.setTimeout(() => setDir(null), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);

  return dir;
}
