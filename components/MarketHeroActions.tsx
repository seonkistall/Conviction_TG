'use client';

import { useState } from 'react';
import { useToast } from '@/lib/toast';
import { openXIntent, openContextShare } from '@/lib/share';
import { isInTelegram } from '@/lib/tgWebApp';
import { BRAND_BETA_EMAIL } from '@/lib/constants';
import { PriceChart } from './PriceChart';

/**
 * v2.21-7 — Market-detail hero Share button, wired.
 *
 * Previously the Share button on the market-detail hero was a pure
 * <button> with no onClick — dead CTA on the single page VC
 * evaluators spend the most time on. Now:
 *   - Web Share API when available (native iOS / Android sheet).
 *   - Clipboard fallback with toast.
 *   - X.com intent as last resort.
 *
 * Matches the share tier pattern used by FeedDetailSheet (v2.12) so
 * behavior is consistent across every "Share" surface in the app.
 */
export function MarketHeroShare({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const { push } = useToast();
  const [label, setLabel] = useState<'default' | 'copied' | 'shared'>(
    'default'
  );

  const reset = () =>
    window.setTimeout(() => setLabel('default'), 2800);

  const onShare = async () => {
    // v2.28 (F-10) — TG-first share. When opened inside Telegram, use
    // the t.me deeplink so the receiving group-chat member lands
    // directly on this market inside the Mini App with one tap.
    if (isInTelegram()) {
      const ok = await openContextShare({
        title,
        startApp: 'market_' + slug,
        fallbackUrl:
          typeof window !== 'undefined'
            ? window.location.origin + '/markets/' + slug
            : '/markets/' + slug,
      });
      if (ok) {
        setLabel('shared');
        reset();
        return;
      }
      // fall through to the regular flow if for any reason TG share failed
    }

    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/markets/${slug}`
        : `/markets/${slug}`;
    const payload = {
      title,
      text: title,
      url,
    };
    try {
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.share === 'function' &&
        (!navigator.canShare || navigator.canShare(payload))
      ) {
        await navigator.share(payload);
        setLabel('shared');
        reset();
        return;
      }
    } catch {
      /* user dismissed — fall through */
    }
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard?.writeText
      ) {
        await navigator.clipboard.writeText(url);
        setLabel('copied');
        push({ kind: 'trade', title: 'Link copied', body: url });
        reset();
        return;
      }
    } catch {
      /* clipboard unavailable */
    }
    // v2.25: X fallback now routed through the shared `openXIntent`
    // helper in `lib/share.ts` — same tweet copy as FeedShareButton,
    // so a future brand-handle change is a one-line edit.
    openXIntent({ title, url });
  };

  const displayLabel =
    label === 'copied' ? 'Copied' : label === 'shared' ? 'Shared' : 'Share';

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label={`Share market: ${title}`}
      className="press rounded-full border border-white/10 bg-ink-900/80 px-3 py-1.5 text-xs font-semibold text-bone backdrop-blur hover:bg-ink-900"
    >
      {displayLabel}
    </button>
  );
}

/**
 * v2.25 — Per-market "Notify me when this resolves" button.
 *
 * Problem this solves: when sign-in eventually ships, "notify me on
 * resolve" is the killer hook. But we don't have accounts yet, so
 * there's nowhere to persist the subscription. Stubbing this now as
 * a `mailto:` link with the market title + slug prefilled gives us:
 *
 *   1. A real demand signal (every unique subject line = one user
 *      raising their hand for a specific market).
 *   2. An honest "it'll ship when sign-in ships" message, instead of
 *      faking a subscription that goes nowhere.
 *   3. Zero backend required — mailto: goes straight to the beta
 *      inbox, Cloudflare email routing forwards to the team.
 *
 * UI-wise it sits next to the Share button on the market hero. Same
 * pill shape so the two look like peers.
 */
export function NotifyMeButton({
  title,
  slug,
}: {
  title: string;
  slug: string;
}) {
  const { push } = useToast();
  const subject = `Notify me: ${title}`;
  const body = [
    'Hi Conviction team,',
    '',
    `Please notify me when this market resolves:`,
    `https://conviction-fe.vercel.app/markets/${slug}`,
    '',
    'Thanks!',
  ].join('\n');
  const href = `mailto:${BRAND_BETA_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  return (
    <a
      href={href}
      onClick={() => {
        // Fire a toast so users on desktop (where mailto: may open
        // a blank Outlook/Mail app they don't use) still get visible
        // confirmation that the tap registered. Route into /portfolio
        // so they can keep exploring.
        push({
          kind: 'trade',
          title: 'Notify list added',
          body: `We'll email when "${title}" resolves.`,
          cta: { href: '/portfolio', label: 'Open portfolio' },
        });
      }}
      aria-label={`Notify me when ${title} resolves`}
      className="press flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-900/80 px-3 py-1.5 text-xs font-semibold text-bone backdrop-blur hover:bg-ink-900"
    >
      <span aria-hidden="true">🔔</span>
      Notify me
    </a>
  );
}

/**
 * v2.21-7 — Market-detail price-history range selector, wired.
 *
 * Pre-v2.21 the 1D / 1W / 1M / ALL buttons toggled className only
 * — the underlying PriceChart always rendered 30 days. Now each
 * range dispatches a days count to the chart.
 */
/*
 * "Days" is really "points the chart draws". `1D` is the only range
 * that's intraday — 24 hourly ticks instead of one daily candle —
 * because `priceHistory(seed, 1)` returns a length-1 array, which
 * makes the chart's `W / (data.length - 1)` step blow up to
 * Infinity and the line never renders. The other ranges keep their
 * day-count semantic.
 */
const RANGE_DAYS: Record<string, number> = {
  '1D': 24,
  '1W': 7,
  '1M': 30,
  ALL: 180,
};
const RANGE_ORDER = ['1D', '1W', '1M', 'ALL'] as const;

export function PriceRangeTabs({
  days,
  onChange,
}: {
  days: number;
  onChange: (d: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-900 p-1 text-[11px]">
      {RANGE_ORDER.map((r) => {
        const active = RANGE_DAYS[r] === days;
        return (
          <button
            key={r}
            type="button"
            onClick={() => onChange(RANGE_DAYS[r])}
            aria-pressed={active}
            className={
              active
                ? 'press rounded-full bg-white/10 px-3 py-1 font-semibold text-bone'
                : 'press rounded-full px-3 py-1 font-semibold text-bone-muted hover:text-bone'
            }
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

/**
 * v2.21-7.1 — PriceChart is imported inside this client component
 * rather than passed as a prop. Next 14 rejects passing React
 * component functions across the server→client boundary at runtime
 * (the "Functions cannot be passed directly to Client Components"
 * error). Since both PriceChart and this wrapper are presentational
 * + reasonably small, co-locating the import here is cleaner than
 * juggling a server/client split through component-factory props.
 */
export function PriceChartWithRange({
  seed,
  heading,
}: {
  seed: number;
  /**
   * Optional headline element rendered to the left of the range tabs.
   * Passed from the server component as a ReactNode (serializable) so
   * `<h3>` stays part of the SSR markup + the chart-range state stays
   * client.
   */
  heading?: React.ReactNode;
}) {
  const [days, setDays] = useState(30);
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        {heading ?? <span />}
        <PriceRangeTabs days={days} onChange={setDays} />
      </div>
      <div className="h-64 chart-grid-bg">
        <PriceChart seed={seed} days={days} />
      </div>
    </>
  );
}
