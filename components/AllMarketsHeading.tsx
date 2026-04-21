'use client';

import { useT } from '@/lib/i18n';

export function AllMarketsHeading({ total }: { total: number }) {
  const t = useT();
  return (
    <section className="mt-16">
      <div className="mx-auto mb-6 flex max-w-[1440px] items-baseline justify-between px-6">
        <h2 className="font-display text-4xl text-bone">{t('hp.all_markets')}</h2>
        <span className="text-sm text-bone-muted">
          {total} live · updated 00:04 ago
        </span>
      </div>
    </section>
  );
}
