'use client';
/**
 * Minimal toast store — no external deps, no portals, no animations
 * beyond a CSS transition. Emits small receipts for trade + parlay
 * events so the app can keep the feel of "something just happened".
 *
 * Renderer lives in components/Toaster.tsx.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

export type ToastKind = 'trade' | 'parlay' | 'info' | 'error';

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** Optional monospaced "amount" line pinned right (e.g. "$73.00"). */
  amount?: string;
  /** ms before auto-dismiss. Defaults to 3500. */
  ttl?: number;
  /** Optional link + CTA (renders as a chip). */
  cta?: { href: string; label: string };
}

interface ToastCtx {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<ToastCtx>({
  toasts: [],
  push: () => {},
  dismiss: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const h = timers.current.get(id);
    if (h) {
      clearTimeout(h);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback<ToastCtx['push']>(
    (t) => {
      const id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `tst_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
      const next: Toast = { id, ttl: 3500, ...t };
      setToasts((list) => [next, ...list].slice(0, 4));
      const ttl = next.ttl ?? 3500;
      if (ttl > 0) {
        const h = setTimeout(() => dismiss(id), ttl);
        timers.current.set(id, h);
      }
    },
    [dismiss]
  );

  // Clean up outstanding timers on unmount (HMR, route change with StrictMode, …)
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => clearTimeout(h));
      map.clear();
    };
  }, []);

  return (
    <Ctx.Provider value={{ toasts, push, dismiss }}>{children}</Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
