'use client';

import { useT } from '@/lib/i18n';

export function AllMarketsHeading({ total }: { total: number }) {
  const t = useT();
  return (
    <section className="mt-12 sm:mt-16">
      <div className="mx-auto mb-6 flex max-w-[1440px] flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-6">
        <h2 className="font-display text-3xl text-bone sm:text-4xl">
          {t('hp.all_markets')}
        </h2>
        <span className="text-xs text-bone-muted sm:text-sm">
          {total} live · updated 00:04 ago
        </span>
      </div>
    </section>
  );
}
