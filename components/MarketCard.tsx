import Link from 'next/link';
import clsx from 'clsx';
import type { Market } from '@/lib/types';
import { AutoVideo } from './AutoVideo';
import { EdgeBadge } from './EdgeBadge';
import { OutcomeBar } from './OutcomeBar';
import { formatUSD, pct, timeUntil } from '@/lib/format';

interface Props {
  market: Market;
  size?: 'sm' | 'md' | 'lg' | 'wide';
}

export function MarketCard({ market, size = 'md' }: Props) {
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

  return (
    <Link
      href={`/markets/${market.slug}`}
      className={clsx(
        'group relative block overflow-hidden rounded-2xl border border-white/5 bg-ink-800 transition hover:border-white/20',
        aspect
      )}
    >
      <AutoVideo
        media={market.media}
        className="absolute inset-0 h-full w-full"
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
          {market.trending && (
            <Badge intent="volt">
              <span className="mr-1">🔥</span>Trending
            </Badge>
          )}
          {typeof market.edgePP === 'number' && market.edgePP >= 5 && (
            <EdgeBadge pp={market.edgePP} />
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-ink-900/80 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-bone-muted backdrop-blur">
          <span className="live-dot" />
          {timeUntil(market.endsAt)}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-xl leading-[1.05] text-bone md:text-2xl">
          {market.title}
        </h3>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl font-bold tabular-nums text-bone">
                {pct(market.yesProb)}
              </span>
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

          {/* AI confidence dial */}
          <AIConfidenceDial
            value={market.aiConfidence}
            trend={market.aiTrend}
          />
        </div>

        {/* Quick actions — binary YES/NO or multi outcome strip */}
        <div className="mt-3">
          {isMulti ? (
            <OutcomeBar market={market} compact />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <QuickAction side="YES" price={market.yesProb} />
              <QuickAction side="NO" price={1 - market.yesProb} />
            </div>
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

function QuickAction({ side, price }: { side: 'YES' | 'NO'; price: number }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold backdrop-blur transition group-hover:scale-[1.02]',
        side === 'YES'
          ? 'border-yes/30 bg-yes-soft text-yes'
          : 'border-no/30 bg-no-soft text-no'
      )}
    >
      <span>{side}</span>
      <span className="font-mono tabular-nums">¢{(price * 100).toFixed(0)}</span>
    </div>
  );
}

function AIConfidenceDial({
  value,
  trend,
}: {
  value: number;
  trend: 'up' | 'down' | 'flat';
}) {
  const deg = value * 360;
  return (
    <div
      className="relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-900/80 backdrop-blur"
      title={`Conviction AI confidence: ${Math.round(value * 100)}%`}
      style={{
        background: `conic-gradient(#C6FF3D ${deg}deg, rgba(255,255,255,0.08) ${deg}deg)`,
      }}
    >
      <div className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-ink-900">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
          AI
        </span>
        <span className="font-mono text-sm font-bold text-bone">
          {Math.round(value * 100)}
        </span>
      </div>
      <span
        className={clsx(
          'absolute -bottom-1 right-0 rounded-full bg-ink-900 px-1 text-[10px]',
          trend === 'up' && 'text-yes',
          trend === 'down' && 'text-no',
          trend === 'flat' && 'text-bone-muted'
        )}
      >
        {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–'}
      </span>
    </div>
  );
}
