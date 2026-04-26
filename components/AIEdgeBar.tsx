'use client';

import clsx from 'clsx';

/**
 * v2.26.2 — AI Edge meter for FeedCard.
 *
 * Why this exists
 * ---------------
 * Conviction's distinctive moat is the AI-graded oracle: every market
 * has a 23-source AI confidence score that the displayed market price
 * may or may not agree with. The previous EdgeBadge surfaced the gap
 * as a small chip ("+16PP") in the top toolbar, but at thumbnail /
 * scroll speed a chip reads as "another tag" — VCs flick past it.
 *
 * The AI Edge bar promotes the same data to a one-line meter directly
 * below the top chip row, taking the full content width:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ AI 78%   ━━━━━━━━━━━●━━━━━━━━━━○━━━━  +16pp │
 *   │           market 62%        AI 78%            │
 *   └──────────────────────────────────────────────┘
 *
 *   - The bar fills from 0..AI confidence in the directional color
 *     (volt when AI > market = bullish edge, red when AI < market
 *     = bearish edge, gray when |gap| < 5pp = neutral)
 *   - A vertical white tick marks the current market price so the
 *     viewer reads "where market is" vs "where AI thinks it should
 *     be" in one glance
 *   - The pill on the right calls out the gap with a directional
 *     arrow (▲ / ▼) and "pp edge" — sized to be the second-loudest
 *     element on the card after the title
 *
 * Pulse cadence
 * -------------
 * Every ~5s the right edge of the volt fill emits a soft glow (the
 * same `bet-pulse` keyframe pattern used elsewhere) — a subtle
 * heartbeat that says "AI is live, not a static label". Respects
 * prefers-reduced-motion: the pulse is disabled.
 *
 * Edge cases
 * ----------
 *   - Resolved markets: bar is hidden entirely (the AI was right or
 *     wrong, the gap is academic and confuses the read)
 *   - No AI confidence in payload (defensive): hidden
 */
interface Props {
  /** AI confidence in [0, 1]. */
  aiConfidence: number;
  /** Market YES probability in [0, 1]. */
  yesProb: number;
  /** Hide the bar entirely (resolved markets, etc.). */
  hidden?: boolean;
  className?: string;
}

const NEUTRAL_THRESHOLD_PP = 3; // |gap| below this → neutral gray

export function AIEdgeBar({
  aiConfidence,
  yesProb,
  hidden,
  className,
}: Props) {
  if (hidden) return null;

  const aiPct = Math.round(aiConfidence * 100);
  const mktPct = Math.round(yesProb * 100);
  const edgePP = aiPct - mktPct;
  const absEdge = Math.abs(edgePP);
  const direction: 'bull' | 'bear' | 'neutral' =
    absEdge < NEUTRAL_THRESHOLD_PP
      ? 'neutral'
      : edgePP > 0
      ? 'bull'
      : 'bear';

  const fillColor =
    direction === 'bull'
      ? 'bg-volt'
      : direction === 'bear'
      ? 'bg-no'
      : 'bg-bone-muted/40';
  const pillColor =
    direction === 'bull'
      ? 'bg-volt/15 text-volt'
      : direction === 'bear'
      ? 'bg-no/15 text-no'
      : 'bg-bone-muted/15 text-bone-muted';
  const arrow =
    direction === 'bull' ? '▲' : direction === 'bear' ? '▼' : '▬';

  // The volt pulse highlights the rightmost edge of the fill — that's
  // visually "where the AI thinks the market should converge to".
  const pulseClass =
    direction === 'bull' ? 'edge-pulse-volt' : direction === 'bear' ? 'edge-pulse-no' : '';

  return (
    <div
      className={clsx(
        'flex w-full items-center gap-2 rounded-full border border-white/10 bg-ink-900/70 px-3 py-1.5 backdrop-blur',
        className
      )}
      role="group"
      aria-label={`AI confidence ${aiPct} percent versus market ${mktPct} percent`}
    >
      {/* Left: AI label + percent — the headline number */}
      <div className="flex shrink-0 items-baseline gap-1">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
          AI
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-bone">
          {aiPct}%
        </span>
      </div>

      {/* Middle: gauge bar
          -- background is a subtle white line
          -- filled portion runs from 0 to AI confidence
          -- a vertical tick marks the market price
       */}
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-[width]',
            fillColor,
            pulseClass
          )}
          style={{ width: `${aiPct}%` }}
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-bone"
          style={{ left: `${mktPct}%` }}
          aria-hidden="true"
          title={`Market ${mktPct}%`}
        />
      </div>

      {/* Right: edge call-out — directional pill */}
      <span
        className={clsx(
          'shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums',
          pillColor
        )}
      >
        {arrow} {edgePP >= 0 ? '+' : ''}
        {edgePP}pp
      </span>
    </div>
  );
}
