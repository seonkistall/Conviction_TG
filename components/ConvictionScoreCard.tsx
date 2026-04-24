'use client';

import { useConvictionScore } from '@/lib/convictionScore';

/**
 * v2.25 — Conviction Score card on /portfolio.
 *
 * Shows the user's "you've been right X% of the time" headline plus
 * the top-performing category breakdown. Below the 3-position sample
 * threshold it renders a nudge explaining what the score is and
 * telling the user to trade more to unlock it — respecting privacy
 * (no "0/0" badge bragging about nothing) and the signal/noise ratio
 * (small samples aren't information).
 *
 * Design intent:
 *   - Big number up top — the hero stat, a friend would recite it.
 *   - Streak and sample size immediately below — context so "73%"
 *     doesn't read like "73% of 1 trade".
 *   - Top categories as a stacked row so users can see "you're
 *     actually a K-pop expert" at a glance.
 */
export function ConvictionScoreCard() {
  const score = useConvictionScore();

  if (!score) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-ink-800 to-ink-900 p-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
          Conviction Score
        </div>
        <h3 className="mt-1 font-display text-2xl text-bone">
          Place 3 more trades to unlock
        </h3>
        <p className="mt-2 text-sm text-bone-muted">
          Your Conviction Score is your overall hit-rate across every
          market you trade, broken out by category. We hold it until
          you have enough signal to mean something (≥3 positions).
        </p>
      </div>
    );
  }

  const overallPct = Math.round(score.overall * 100);
  const top = score.byCategory.slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-volt/30 bg-gradient-to-br from-conviction/10 via-ink-800 to-ink-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-volt">
            ✨ Conviction Score
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold text-bone">
              {overallPct}%
            </span>
            <span className="text-sm text-bone-muted">
              ({score.wins}/{score.total})
            </span>
          </div>
        </div>
        {score.streak >= 2 && (
          <div className="rounded-full border border-yes/40 bg-yes-soft px-3 py-1.5 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-yes/90">
              Streak
            </div>
            <div className="font-mono text-lg font-bold text-yes">
              🔥 {score.streak}
            </div>
          </div>
        )}
      </div>

      {top.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
            Top categories
          </div>
          <ul className="mt-2 space-y-1.5">
            {top.map((c) => (
              <li
                key={c.category}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-bone">{c.category}</span>
                <span className="font-mono text-bone-muted">
                  {Math.round(c.score * 100)}%
                  <span className="ml-1 text-[10px] text-bone-muted/60">
                    ({c.wins}/{c.total})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
