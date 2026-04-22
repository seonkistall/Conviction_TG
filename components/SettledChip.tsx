'use client';

import { useT } from '@/lib/i18n';

/**
 * Localized "Settled · final ¢NN" chip used at the bottom of resolved
 * market cards. Lives as its own client leaf so it can read the active
 * locale via useT() while the host card stays a server component.
 */
export function SettledChip({
  closePrice,
  variant = 'card',
}: {
  closePrice: number;
  variant?: 'card' | 'feed';
}) {
  const t = useT();
  const cents = Math.round((closePrice ?? 0) * 100);
  if (variant === 'feed') {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-[12px] font-semibold uppercase tracking-widest text-bone-muted backdrop-blur">
        {t('market.settled_final')}
        {cents}
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-white/5 bg-ink-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-bone-muted backdrop-blur">
      {t('market.settled_final')}
      {cents}
    </div>
  );
}
