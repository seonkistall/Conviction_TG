'use client';

import Link from 'next/link';
import clsx from 'clsx';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { EdgeBadge } from './EdgeBadge';
import { OutcomeBar } from './OutcomeBar';
import { formatUSD, pct, timeUntil } from '@/lib/format';
import { useParlay } from '@/lib/parlay';
import { useT } from '@/lib/i18n';

interface Props {
  market: Market;
}

/**
 * Full-viewport TikTok-style market card. Snaps vertically on a snap-feed
 * container. Right rail has vertical-stack action buttons (like / comment
 * / parlay / share) in the familiar short-form video UX.
 */
export function FeedCard({ market }: Props) {
  const parlay = useParlay();
  const t = useT();
  const inParlay = parlay.hasLeg(market.id);

  return (
    <article className="relative h-[100dvh] w-full overflow-hidden bg-ink-900 snap-start">
      {/* Video background — full bleed */}
      <AutoVideo
        media={market.media}
        className="absolute inset-0 h-full w-full"
        fit="cover"
      />
      <div className="pointer-events-none absolute inset-0 feed-overlay" />

      {/* Top bar — category + live */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4 pt-[env(safe-area-inset-top,1rem)]">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink-900/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-bone backdrop-blur">
            {market.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-900/60 px-2.5 py-1 text-[11px] text-bone-muted backdrop-blur">
            <span className="live-dot" />
            {timeUntil(market.endsAt)}
          </span>
          {market.edgePP && market.edgePP >= 5 && <EdgeBadge pp={market.edgePP} />}
        </div>
      </div>

      {/* Right rail actions */}
      <div className="absolute right-3 bottom-[22dvh] z-10 flex flex-col items-center gap-4 md:right-6 md:bottom-[18dvh]">
        <RailButton icon="♥" label={market.traders.toLocaleString()} />
        <RailButton icon="💬" label={Math.round(market.traders / 7).toLocaleString()} />
        <button
          type="button"
          onClick={() =>
            parlay.add({ marketId: market.id, pick: 'YES', price: market.yesProb })
          }
          className={clsx(
            'flex h-12 w-12 flex-col items-center justify-center rounded-full font-bold transition',
            inParlay
              ? 'bg-volt text-ink-900 scale-105'
              : 'bg-ink-900/70 text-volt hover:bg-ink-900 backdrop-blur'
          )}
          aria-label={t('feed.add_parlay')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" />
          </svg>
        </button>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
          {t('feed.add_parlay_short')}
        </span>
        <RailButton icon="↗" label="Share" />
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 pb-[calc(env(safe-area-inset-bottom,0)+1rem)] pr-20 md:pr-24">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-bone-muted">
          {market.tags.slice(0, 3).map((tg) => (
            <span
              key={tg}
              className="rounded-full border border-white/10 bg-ink-900/60 px-2 py-0.5 backdrop-blur"
            >
              #{tg}
            </span>
          ))}
        </div>
        <Link
          href={`/markets/${market.slug}`}
          className="mt-2 block font-display text-2xl leading-[1.1] text-bone md:text-4xl"
        >
          {market.title}
        </Link>

        {/* YES/NO quick-bet for binary, outcome bar for multi */}
        {market.kind === 'binary' ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickBet
              side="YES"
              price={market.yesProb}
              marketId={market.id}
            />
            <QuickBet
              side="NO"
              price={1 - market.yesProb}
              marketId={market.id}
            />
          </div>
        ) : (
          <div className="mt-4">
            <OutcomeBar market={market} compact />
          </div>
        )}

        {/* Stats strip */}
        <div className="mt-3 flex items-center gap-4 text-[11px] text-bone-muted">
          <span className="font-mono">
            <span className="text-bone">{pct(market.yesProb)}</span> {t('card.yes')}
          </span>
          <span>·</span>
          <span>{formatUSD(market.volume)} {t('card.vol')}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-volt" />
            AI {Math.round(market.aiConfidence * 100)}
          </span>
        </div>
      </div>

      {/* Swipe-hint — only on first card */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center opacity-0 md:opacity-0">
        <span className="rounded-full border border-white/10 bg-ink-900/70 px-3 py-1 text-[11px] text-bone-muted backdrop-blur">
          {t('feed.long_swipe')}
        </span>
      </div>
    </article>
  );
}

function RailButton({ icon, label }: { icon: string; label: string }) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1 text-bone drop-shadow-lg"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/70 text-xl backdrop-blur transition hover:bg-ink-900">
        {icon}
      </span>
      <span className="text-[10px] font-semibold text-bone-muted">{label}</span>
    </button>
  );
}

function QuickBet({
  side,
  price,
  marketId,
}: {
  side: 'YES' | 'NO';
  price: number;
  marketId: string;
}) {
  const parlay = useParlay();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        parlay.add({ marketId, pick: side, price });
      }}
      className={clsx(
        'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold uppercase tracking-widest backdrop-blur transition hover:scale-[1.02]',
        side === 'YES'
          ? 'border-yes/40 bg-yes-soft text-yes hover:bg-yes/20'
          : 'border-no/40 bg-no-soft text-no hover:bg-no/20'
      )}
    >
      <span>{side}</span>
      <span className="font-mono tabular-nums">¢{Math.round(price * 100)}</span>
    </button>
  );
}
