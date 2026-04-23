'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';

/**
 * v2.17 — Makes the AI-confidence dial on a MarketCard a *real* button
 * rather than a decorative <div>.
 *
 * Problem
 * -------
 * Through v2.16 the confidence dial was a plain <div> inside the card's
 * parent <Link>. Clicking it followed the Link to the market detail
 * page — same as clicking the thumbnail or title — but the dial is the
 * visual tip of the Conviction Oracle value prop ("23-source evidence
 * swarm"), and giving evaluators zero feedback that it's interactive
 * hides the flagship moat.
 *
 * What this component does
 * ------------------------
 * 1. Renders the same conic-gradient ring + number + trend arrow.
 * 2. Is a <button>, not a div — SR users hear "button, AI confidence
 *    84%, open evidence bundle".
 * 3. `preventDefault()` + `stopPropagation()` on click so the parent
 *    <Link> doesn't also fire (same pattern QuickBetActions uses).
 * 4. Navigates to `/markets/<slug>?evidence=open`. The detail page's
 *    AIOracleCard reads that param and boots with the side sheet
 *    expanded, so the user lands directly on the AI rationale instead
 *    of hunting for the "Inspect" button halfway down the detail page.
 *
 * Why a client component instead of inlining into MarketCard
 * ----------------------------------------------------------
 * MarketCard stays server-renderable (used from server pages —
 * leaderboard, worlds-2026, etc.). Moving it to "use client" would
 * bloat the client tree and hurt LCP, same reason LiveMarketGrid was
 * extracted in v2.15.
 */
interface Props {
  slug: string;
  value: number;
  trend: 'up' | 'down' | 'flat';
}

export function EvidenceDialButton({ slug, value, trend }: Props) {
  const router = useRouter();
  const deg = value * 360;
  const pctLabel = Math.round(value * 100);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/markets/${slug}?evidence=open`);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      // Slight hover lift signals this is interactive — the dial looked
      // ornamental otherwise. focus-visible ring plays with the rest of
      // the card's WCAG pass (v2.12 Polish).
      className={clsx(
        'relative flex h-14 w-14 items-center justify-center rounded-full bg-ink-900/80 backdrop-blur transition',
        'hover:scale-105 hover:ring-2 hover:ring-conviction/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conviction'
      )}
      aria-label={`AI Oracle confidence ${pctLabel}%. Open evidence bundle.`}
      title={`${pctLabel}% AI confidence · tap to inspect evidence`}
      style={{
        background: `conic-gradient(#C6FF3D ${deg}deg, rgba(255,255,255,0.08) ${deg}deg)`,
      }}
    >
      <span className="flex h-11 w-11 flex-col items-center justify-center rounded-full bg-ink-900">
        <span className="text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
          AI
        </span>
        <span className="font-mono text-sm font-bold text-bone">
          {pctLabel}
        </span>
      </span>
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
    </button>
  );
}
