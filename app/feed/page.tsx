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
  return <FeedClient markets={ordered} />;
}
