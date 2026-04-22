import { Skeleton } from '@/components/Skeleton';

/**
 * /parlays/[id] loading skeleton — receipt-style card. Parlay receipts
 * are shareable URLs so users hitting this from Twitter / Threads see a
 * branded skeleton while the SSG HTML streams.
 */
export default function ParlayLoading() {
  return (
    <section className="mx-auto max-w-[680px] px-4 pt-6 sm:px-6 sm:pt-10">
      <Skeleton className="h-8 w-40" />
      <div className="mt-6 rounded-3xl border border-white/10 bg-ink-800 p-6 space-y-4">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-px w-full" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
    </section>
  );
}
