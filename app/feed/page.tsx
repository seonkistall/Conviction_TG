import { Suspense } from 'react';
import { LIVE_MARKETS } from '@/lib/markets';
import { FeedClient } from './FeedClient';

export const metadata = {
  title: 'Feed · Conviction',
  description: 'The TikTok of prediction markets — swipe conviction on every APAC narrative.',
};

export default function FeedPage() {
  // Put trending first, then the rest. Resolved markets are excluded —
  // the feed is for live tradable moments only.
  const ordered = [
    ...LIVE_MARKETS.filter((m) => m.trending),
    ...LIVE_MARKETS.filter((m) => !m.trending),
  ];
  return (
    <>
      {/*
       * v2.27-2: Visually-hidden H1 for SEO + screen readers.
       *
       * Pre-v2.27 /feed had no H1 at all — the page is an immersive
       * TikTok-style surface where every card supplies its own
       * title text, so a visual H1 would compete with the video.
       * But search engines and screen readers scan for exactly one
       * H1 per document to anchor the page hierarchy; without one
       * the feed read as "empty page with video" to them.
       *
       * `sr-only` removes it from the visual flow entirely (0×0
       * clipped + `overflow:hidden`) while keeping it in the
       * accessibility tree. One H1, zero visual cost.
       */}
      <h1 className="sr-only">
        Conviction Feed · Live APAC prediction markets
      </h1>
      {/*
       * v2.28-3 — Suspense boundary around FeedClient.
       *
       * FeedClient now calls `useSearchParams()` to parse the
       * `?m=<slug>&s=<YES|NO>` warm-landing query. Next 14 best-
       * practice is to wrap any client subtree that reads search
       * params in a Suspense so the static page shell can prerender
       * and stream while the search-params-dependent subtree hydrates
       * client-side. Without the boundary the entire `/feed` route
       * would opt into client-side rendering, killing FCP for shared
       * social-card landings — exactly the path this feature exists
       * to optimize.
       */}
      <Suspense fallback={null}>
        <FeedClient markets={ordered} />
      </Suspense>
    </>
  );
}
