'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n';
import { CopyShareButton } from './CopyShareButton';

/**
 * <ShareStrip /> — the three-button action row on the parlay receipt page.
 *
 * Copy link · Share on X · Build your own. Lives as its own client leaf so
 * the host page (/parlays/[id]) can stay a server component while the
 * labels pick up the user's locale via useT().
 */
export function ShareStrip({
  shareUrl,
  twitterIntent,
}: {
  shareUrl: string;
  twitterIntent: string;
}) {
  const t = useT();
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <CopyShareButton url={shareUrl} />
      <a
        href={twitterIntent}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-4 py-2.5 text-sm font-semibold text-bone transition hover:border-volt/40 hover:text-volt"
      >
        {t('share.share_on_x')}
      </a>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-volt to-volt-dark px-4 py-2.5 text-sm font-bold text-ink-900 transition hover:brightness-105"
      >
        {t('share.build_your_own')}
      </Link>
    </div>
  );
}
