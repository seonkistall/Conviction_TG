'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * /markets/[id] error boundary. Catches runtime errors in the market detail
 * segment (e.g. a broken PriceChart render, a corrupt order-book payload)
 * without taking down the header, nav, or side-sheet state.
 */
export default function MarketError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[markets/[id]/error]', error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[50vh] max-w-[640px] flex-col items-start justify-center px-6 py-12">
      <div className="inline-flex items-center gap-2 rounded-full border border-no/30 bg-no/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-no">
        Market feed interrupted
      </div>
      <h1 className="mt-4 font-display text-3xl text-bone md:text-4xl">
        Couldn't load this market.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-muted">
        The oracle dropped a connection while rendering this page. Nothing
        in your portfolio was affected. Try again, or head back to the live
        catalog.
      </p>
      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          onClick={reset}
          className="rounded-full bg-volt px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
        >
          Retry
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-ink-800 px-5 py-2.5 text-center text-sm font-semibold text-bone hover:bg-ink-700"
        >
          All markets
        </Link>
      </div>
    </section>
  );
}
