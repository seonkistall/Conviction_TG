import { Skeleton } from '@/components/Skeleton';

/**
 * /traders/[handle] loading skeleton — trader hero card + perf chart +
 * positions list. Mirrors the real page shape so users don't see layout
 * jumps when the SSG content streams in.
 */
export default function TraderLoading() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-4 space-y-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <div className="md:col-span-8 space-y-4">
          <Skeleton className="h-56 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
