import { Skeleton } from '@/components/Skeleton';

/**
 * /feed loading skeleton — single full-bleed card placeholder that matches
 * the TikTok-style vertical shorts layout. Shimmers in ink-900 so it fades
 * seamlessly into the first real card when data hydrates.
 *
 * We deliberately do NOT render the side rail / top chrome here — the
 * ChromeShell mounts those outside Suspense, so they're already present.
 */
export default function FeedLoading() {
  return (
    <div className="relative mx-auto h-[100dvh] w-full bg-ink-900 md:max-w-[420px]">
      {/* Top progress bar placeholder */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[2px] bg-white/5" />

      {/* Fake card body */}
      <div className="relative h-full w-full overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />

        {/* Overlay content placeholders — match real FeedCard geometry */}
        <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-transparent p-5 pb-24">
          <Skeleton className="h-4 w-20 rounded-full" />
          <Skeleton className="h-7 w-11/12 rounded-lg" />
          <Skeleton className="h-7 w-3/4 rounded-lg" />
          <div className="mt-3 flex gap-2">
            <Skeleton className="h-11 flex-1 rounded-full" />
            <Skeleton className="h-11 flex-1 rounded-full" />
          </div>
          <div className="flex gap-4 pt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}
