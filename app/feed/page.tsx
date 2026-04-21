import { MARKETS } from '@/lib/markets';
import { FeedClient } from './FeedClient';

export const metadata = {
  title: 'Feed · Conviction',
  description: 'The TikTok of prediction markets — swipe conviction on every APAC narrative.',
};

export default function FeedPage() {
  // Put trending first, then the rest.
  const ordered = [
    ...MARKETS.filter((m) => m.trending),
    ...MARKETS.filter((m) => !m.trending),
  ];
  return <FeedClient markets={ordered} />;
}
