import { Skeleton } from '@/components/Skeleton';

/**
 * /portfolio loading skeleton. Mirrors the real page layout: user header,
 * 4-stat row, 30d chart, tickets section, positions table + activity rail.
 */
export default function PortfolioLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-9 w-56" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>

      {/* 4 stats */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-ink-800 p-5 space-y-3"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-ink-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>

      {/* Tickets */}
      <div className="mt-10">
        <Skeleton className="h-8 w-48" />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>

      {/* Positions + activity */}
      <div className="mt-10 grid gap-8 md:grid-cols-12">
        <div className="md:col-span-8 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <div className="md:col-span-4 space-y-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
