'use client';
/**
 * <Toaster /> — fixed top-right stack of receipts. Rendered once in the
 * root layout, reads from useToast(). Respects `prefers-reduced-motion`.
 *
 * Left border color hints at the toast kind: volt for trade, conviction
 * (purple) for parlay, bone-muted for info, no (red) for error.
 */
import Link from 'next/link';
import clsx from 'clsx';
import { useToast, type Toast } from '@/lib/toast';

const KIND_STYLES: Record<
  Toast['kind'],
  { accent: string; label: string; icon: string }
> = {
  trade: {
    accent: 'border-l-volt',
    label: 'Trade filled',
    icon: '⇌',
  },
  parlay: {
    accent: 'border-l-conviction',
    label: 'Parlay placed',
    icon: '✚',
  },
  info: {
    accent: 'border-l-white/30',
    label: 'Notice',
    icon: '◎',
  },
  error: {
    accent: 'border-l-no',
    label: 'Error',
    icon: '!',
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[min(92vw,360px)] flex-col gap-2 md:right-6 md:top-24"
    >
      {toasts.map((t) => {
        const k = KIND_STYLES[t.kind];
        return (
          <div
            key={t.id}
            className={clsx(
              'toast-in pointer-events-auto rounded-xl border border-white/10 border-l-4 bg-ink-800/95 p-3.5 shadow-xl backdrop-blur',
              k.accent
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-sm text-bone">
                {k.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                    {k.label}
                  </div>
                  {t.amount && (
                    <div className="font-mono text-sm tabular-nums text-bone">
                      {t.amount}
                    </div>
                  )}
                </div>
                <div className="mt-1 line-clamp-2 text-sm font-medium text-bone">
                  {t.title}
                </div>
                {t.body && (
                  <div className="mt-0.5 line-clamp-2 text-[12px] text-bone-muted">
                    {t.body}
                  </div>
                )}
                {t.cta && (
                  <Link
                    href={t.cta.href}
                    onClick={() => dismiss(t.id)}
                    className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-widest text-volt hover:text-volt-dark"
                  >
                    {t.cta.label} →
                  </Link>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-full text-bone-muted hover:bg-white/5 hover:text-bone"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
