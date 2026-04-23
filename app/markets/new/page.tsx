import { Suspense } from 'react';
import { NewMarketClient } from './NewMarketClient';

export const metadata = {
  title: 'Propose a market · Conviction',
  description:
    'Type a question. Conviction agents parse intent, fan out 23 scrapers, Qwen3 drafts, Sonnet verifies — and publish a live market.',
};

/**
 * v2.20-3 — Suspense wrapper around the client. NewMarketClient now
 * uses `useSearchParams` to pre-fill the textarea from `?q=…`
 * (DebutCalendar spawn CTA), which Next 14 requires to sit inside a
 * Suspense boundary at build time. Without this, `next build`
 * prerender errors on the route. The fallback is near-empty so the
 * paint cost is negligible.
 */
export default function NewMarketPage() {
  return (
    <Suspense fallback={null}>
      <NewMarketClient />
    </Suspense>
  );
}
