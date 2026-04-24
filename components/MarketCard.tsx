import Link from 'next/link';
import clsx from 'clsx';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { EdgeBadge } from './EdgeBadge';
import { OutcomeBar } from './OutcomeBar';
import { ResolvedBanner } from './ResolvedBanner';
import { SettledChip } from './SettledChip';
import { QuickBetActions } from './QuickBetActions';
import { EvidenceDialButton } from './EvidenceDialButton';
import { LivePrice } from './LivePrice';
import { formatUSD, pct, timeUntil } from '@/lib/format';

interface Props {
  market: Market;
  size?: 'sm' | 'md' | 'lg' | 'wide';
  /**
   * v2.15 — Optional live price override fed by `<LiveMarketGrid>`.
   * When omitted, falls back to `market.yesProb` so MarketCard stays
   * a pure presentational component renderable from server pages.
   */
  livePrice?: number;
}

export function MarketCard({ market, size = 'md', livePrice }: Props) {
  const displayProb = livePrice ?? market.yesProb;
  const isLive = typeof livePrice === 'number' && market.status !== 'resolved';
  const aspect =
    size === 'wide'
      ? 'aspect-[16/9]'
      : size === 'lg'
      ? 'aspect-[4/5]'
      : size === 'sm'
      ? 'aspect-[4/5]'
      : 'aspect-[4/5]';

  const isMulti = market.kind === 'multi';
  const topLabel = isMulti ? market.outcomes?.[0]?.label : 'Yes';
  const isResolved = market.status === 'resolved';

  return (
    <Link
      href={`/markets/${market.slug}`}
      className={clsx(
        'group relative block overflow-hidden rounded-2xl border border-white/5 bg-ink-800 transition hover:border-white/20',
        aspect,
        isResolved && 'opacity-80 hover:opacity-100'
      )}
      aria-label={
        isResolved
          ? `${market.title} — resolved`
          : `${market.title} — ${pct(displayProb)} ${topLabel}`
      }
    >
      <AutoVideo
        media={market.media}
        className={clsx(
          'absolute inset-0 h-full w-full',
          isResolved && 'grayscale'
        )}
        fit="cover"
      />

      {/* Gradient overlay */}
      <div className="pointer-events-none absolute inset-0 card-gradient" />

      {/* Top badges */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{market.category}</Badge>
          {isMulti && (
            <Badge intent="purple">
              {market.outcomes?.length}-way
            </Badge>
          )}
          {market.trending && !isResolved && (
            <Badge intent="volt">
              <span className="mr-1">🔥</span>Trending
            </Badge>
          )}
          {typeof market.edgePP === 'number' && market.edgePP >= 5 && !isResolved && (
            <EdgeBadge pp={market.edgePP} />
          )}
          {isResolved && <ResolvedBanner market={market} variant="chip" />}
        </div>
        {!isResolved && (
          <div className="flex items-center gap-1.5 rounded-full bg-ink-900/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-bone-muted backdrop-blur">
            <span className="live-dot" />
            {timeUntil(market.endsAt)}
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-xl leading-[1.05] text-bone md:text-2xl">
          {market.title}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              {/*
               * v2.25: Swapped the static `pct(displayProb)` number for
               * `<LivePrice showDirection />`. The digits still update
               * per-tick but now a tiny ▲/▼ glyph appears next to them
               * for ~600ms on every change, with the text briefly
               * flashing green/red. Two reasons this matters:
               *   1. At-a-glance signal that "this market actually
               *      moves" — evaluators skimming the grid previously
               *      had to stare at individual numbers to notice the
               *      tick was live.
               *   2. Polymarket/Kalshi house style. Matching their
               *      ambient motion makes Conviction feel like the
               *      same product class rather than a static mock.
               * SSR safety: LivePrice ships the seed text server-side
               * and hydrates to the provider's value, so no layout
               * shift on first paint.
               */}
              <LivePrice
                marketId={market.id}
                seed={displayProb}
                format="percent"
                showDirection
                className="text-3xl font-bold text-bone"
              />
              <span className="text-[11px] font-medium uppercase tracking-wider text-bone-muted line-clamp-1">
                {topLabel}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-bone-muted">
              <span>{formatUSD(market.volume)} Vol</span>
              <span className="h-0.5 w-0.5 rounded-full bg-bone-muted/60" />
              <span>{market.traders.toLocaleString()} traders</span>
            </div>
          </div>

          {/* v2.17 — dial is now an interactive button that deep-links
              into the market detail with the evidence sheet pre-opened. */}
          <EvidenceDialButton
            slug={market.slug}
            value={market.aiConfidence}
            trend={market.aiTrend}
          />
        </div>

        {/* Quick actions — binary YES/NO or multi outcome strip */}
        <div className="mt-3">
          {isResolved ? (
            <SettledChip closePrice={market.closePrice ?? 0} />
          ) : isMulti ? (
            // v2.26: Markets-grid callers use the sheet so a card tap
            // stays in-context rather than navigating to the detail
            // page. Matches the FeedCard behavior and the binary
            // YES/NO flow (FeedDetailSheet) for consistency.
            <OutcomeBar market={market} compact useSheet />
          ) : (
            /*
             * v2.11 — real YES/NO buttons (not decorative). One tap adds to
             * Parlay Slip without navigating to market detail. Mobile-first
             * 10–20s judgment loop.
             */
            <QuickBetActions marketId={market.id} yesProb={displayProb} />
          )}
        </div>
      </div>
    </Link>
  );
}

function Badge({
  children,
  intent = 'default',
}: {
  children: React.ReactNode;
  intent?: 'default' | 'volt' | 'purple';
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur',
        intent === 'volt'
          ? 'bg-volt/20 text-volt'
          : intent === 'purple'
          ? 'bg-conviction/20 text-conviction'
          : 'bg-ink-900/70 text-bone'
      )}
    >
      {children}
    </span>
  );
}

// v2.17 — `AIConfidenceDial` removed. The same visual now lives in
// <EvidenceDialButton> (client component) with click-to-open-evidence.
// See components/EvidenceDialButton.tsx.
