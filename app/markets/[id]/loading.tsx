import { Skeleton } from '@/components/Skeleton';

/**
 * /markets/[id] loading skeleton.
 *
 * Rendered during client-side navigation while Next fetches the SSG shell
 * for the requested market. The shape mirrors the real page: tall hero
 * video + headline, YES/NO CTA row, and a two-column detail grid.
 */
export default function MarketLoading() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 sm:pt-10">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <Skeleton className="aspect-video w-full rounded-3xl" />
          <Skeleton className="mt-6 h-10 w-3/4" />
          <Skeleton className="mt-3 h-4 w-1/2" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-full" />
            <Skeleton className="h-12 rounded-full" />
          </div>
        </div>
        <div className="md:col-span-5 space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </section>
  );
}
