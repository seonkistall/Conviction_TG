import Link from 'next/link';

/**
 * Root `not-found.tsx` — rendered by Next when a route throws `notFound()`
 * (e.g. `/markets/[id]` with an unknown slug) and no nested not-found
 * boundary handles it first. Kept as a server component since the copy
 * is fully static; smaller payload, no hydration needed.
 */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-start justify-center px-6 py-16">
      {/*
       * v2.26.4 — Generic copy. The previous copy ("This market doesn't
       * exist") was misleading on /traders/[unknown] and /narratives/
       * [unknown] routes — those aren't markets. Switched to "page"
       * since the root not-found.tsx serves every notFound() in the app.
       */}
      <div className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-volt">
        404 · Page not found
      </div>
      <h1 className="mt-6 display-xl text-5xl text-bone md:text-6xl">
        This page <span className="italic text-volt">doesn't exist</span>.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-bone-muted">
        The link you followed isn't tracked by the Oracle — it may
        have been resolved and archived, or the URL could be wrong. Jump
        into live markets below.
      </p>
      <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <Link
          href="/"
          className="rounded-full bg-volt px-6 py-3 text-center text-sm font-semibold text-ink-900 transition hover:bg-volt-dark"
        >
          Back to home
        </Link>
        <Link
          href="/feed"
          className="rounded-full border border-white/10 bg-ink-800 px-6 py-3 text-center text-sm font-semibold text-bone hover:bg-ink-700"
        >
          Browse feed
        </Link>
      </div>
    </section>
  );
}
