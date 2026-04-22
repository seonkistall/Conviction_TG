import { Skeleton } from '@/components/Skeleton';

/**
 * /leaderboard loading skeleton. Mirrors the podium + full table layout so
 * the shell feels stable while TRADERS hydrates.
 */
export default function LeaderboardLoading() {
  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-4 w-[28rem] max-w-full" />
        </div>
        <Skeleton className="h-9 w-64 rounded-full" />
      </div>

      {/* Podium */}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton
            key={i}
            className={`rounded-3xl ${
              i === 0 ? 'h-64' : i === 1 ? 'h-56' : 'h-52'
            }`}
          />
        ))}
      </div>

      {/* Full table */}
      <div className="mt-10 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
