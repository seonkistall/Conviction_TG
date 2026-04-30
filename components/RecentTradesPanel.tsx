'use client';

/**
 * v2.28.2 — Recent trades panel (P2 baby step).
 *
 * Reads from `useLiveTrades()` instead of the inline `mockTrades()` helper
 * the market detail page used through Sprint-1.1. Visual output is
 * identical — same handle / avatar / shares / cents / ago layout — but
 * the data source is now the swap layer that flips to a real WebSocket
 * the moment NEXT_PUBLIC_LIVE_TRADES_WS_URL is set.
 *
 * Why an island: the parent page.tsx is a server component (it owns
 * the market fixture lookup + JSON-LD payload). useLiveTrades is a
 * client hook, so we hydrate just this strip rather than convert the
 * whole detail page to client.
 */

import { useLiveTrades } from '@/lib/liveTrades';

function ago(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function RecentTradesPanel({
  marketId,
  yesProb,
}: {
  marketId: string;
  yesProb: number;
}) {
  const trades = useLiveTrades(marketId, yesProb, 8);

  return (
    <div className="rounded-2xl border border-white/10 bg-ink-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-2xl text-bone">Recent trades</h3>
        <span className="text-[11px] text-bone-muted">Live · websocket</span>
      </div>
      <div className="divide-y divide-white/5">
        {trades.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between py-2.5 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{t.avatar}</span>
              <span className="text-bone">{t.handle}</span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                  t.side === 'YES' ? 'bg-yes-soft text-yes' : 'bg-no-soft text-no'
                }`}
              >
                {t.side}
              </span>
              <span className="font-mono text-bone-muted">
                {t.shares} shares @ ¢{t.price}
              </span>
            </div>
            <span className="font-mono text-bone-muted">{ago(t.at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
