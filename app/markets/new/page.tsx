import { NewMarketClient } from './NewMarketClient';

export const metadata = {
  title: 'Propose a market · Conviction',
  description:
    'Type a question. Conviction agents parse intent, fan out 23 scrapers, Qwen3 drafts, Sonnet verifies — and publish a live market.',
};

export default function NewMarketPage() {
  return <NewMarketClient />;
}
