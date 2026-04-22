import { Skeleton } from '@/components/Skeleton';

/**
 * /narratives/[slug] loading skeleton — hero banner + basket sparkline +
 * constituent-market grid. Keeps the visual hierarchy stable while the
 * real SSG page streams in on client-side navigation.
 */
export default function NarrativeLoading() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 sm:pt-10">
      <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
      <div className="mt-6 grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-4 h-40 rounded-2xl" />
        </div>
        <div className="md:col-span-4 space-y-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
