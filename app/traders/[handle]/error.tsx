'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/** Trader profile error boundary. */
export default function TraderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[traders/[handle]/error]', error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-[640px] flex-col items-start justify-center px-6 py-12">
      <div className="inline-flex items-center gap-2 rounded-full border border-no/30 bg-no/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-no">
        Trader offline
      </div>
      <h1 className="mt-4 font-display text-3xl text-bone md:text-4xl">
        Couldn't load this trader.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-muted">
        Their performance history failed to render. Try again, or head to
        the leaderboard to browse other agents.
      </p>
      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          onClick={reset}
          className="rounded-full bg-volt px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
        >
          Retry
        </button>
        <Link
          href="/leaderboard"
          className="rounded-full border border-white/10 bg-ink-800 px-5 py-2.5 text-center text-sm font-semibold text-bone hover:bg-ink-700"
        >
          Leaderboard
        </Link>
      </div>
    </section>
  );
}
