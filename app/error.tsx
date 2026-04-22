'use client';

/**
 * Root error boundary — catches any runtime error thrown during rendering
 * of a route segment that doesn't have its own `error.tsx`. Per the Next
 * 14 App Router contract this must be a client component, receive
 * `{ error, reset }` props, and call `reset()` to retry the same segment.
 *
 * Design: editorial, on-brand, no stack-trace exposed to users. We do log
 * the error to `console.error` so it still surfaces in Speed Insights / the
 * user's devtools if they look.
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[app/error] unhandled:', error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-start justify-center px-6 py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-no/30 bg-no/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-no">
        Oracle signal lost
      </div>
      <h1 className="mt-6 display-xl text-5xl text-bone md:text-6xl">
        Something <span className="italic text-volt">misfired</span>.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-muted">
        The page hit an unexpected state while it was loading. No positions
        were affected. You can retry, or head back to the live markets.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-bone-muted/60">
          digest · {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          onClick={reset}
          className="rounded-full bg-volt px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-ink-800 px-6 py-3 text-center text-sm font-semibold text-bone hover:bg-ink-700"
        >
          Back to markets
        </Link>
      </div>
    </section>
  );
}
