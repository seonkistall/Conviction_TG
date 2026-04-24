'use client';
/**
 * Lightweight i18n — no next-intl dependency, no JSON fetch.
 *
 * v2.6.1: strategically English-only for launch. The Provider / useT() /
 * Locale plumbing is retained so a second locale can be re-added without
 * touching call sites — we just drop the dict + toggle UI for now.
 */
import { createContext, useContext } from 'react';

export type Locale = 'en';

type Dict = Record<string, string>;

const EN: Dict = {
  'nav.markets': 'Markets',
  'nav.feed': 'Feed',
  'nav.new': 'New',
  'nav.leaderboard': 'Leaderboard',
  'nav.portfolio': 'Portfolio',
  'nav.methodology': 'Oracle',
  'nav.connect': 'Connect',
  'nav.live': 'Live',
  'nav.search': 'Search markets, traders, tags…',

  'hero.tagline': 'Trade conviction on every Asia narrative that matters.',
  'hero.sub':
    'K-pop, K-drama, LCK, KBO, BTC, elections — priced by AI, proven by evidence, on-chain in APAC.',
  'hero.cta_trade': 'Trade now',
  'hero.cta_how': 'How it works',

  'hp.how_h': 'Priced by AI.',
  'hp.how_h2': 'Proven by evidence.',
  'hp.step_1_t': 'Propose',
  'hp.step_1_d':
    'Anyone can propose a market. The Intent Parser routes it to the right domain stack — KBO, K-pop, LCK, macro.',
  'hp.step_2_t': 'Swarm',
  'hp.step_2_d':
    '23 scrapers fan out in parallel: Brave, Exa, CoinGecko, TheSportsDB, plus a domain-native RAG on ChromaDB.',
  'hp.step_3_t': 'Resolve',
  'hp.step_3_d':
    'Qwen3-32B judges the outcome, Claude Sonnet verifies. Confidence ≥ 0.8 auto-resolves; else human oracle.',
  'hp.all_markets': 'All markets',

  'card.yes': 'Yes',
  'card.trending': 'Trending',
  'card.edge': 'EDGE',
  'card.vol': 'Vol',
  'card.traders': 'traders',

  'feed.title': 'Conviction Feed',
  'feed.sub': 'Swipe the narrative. Bet the conviction.',
  'feed.add_parlay': 'Add to parlay',
  'feed.add_parlay_short': '+ Parlay',
  'feed.long_swipe': 'Swipe up ↑',

  'parlay.title': 'Parlay Slip',
  'parlay.empty': 'Add markets to build a parlay. Multipliers stack.',
  'parlay.legs': 'legs',
  'parlay.stake': 'Stake',
  'parlay.mult': 'Combined multiplier',
  'parlay.payout': 'Max payout',
  'parlay.place': 'Place parlay',
  'parlay.clear': 'Clear',
  'parlay.placing': 'Signing & broadcasting…',
  'parlay.placed': 'Parlay placed on-chain',
  'parlay.tx': 'Tx',
  'parlay.block': 'Block',
  'parlay.view_portfolio': 'View in portfolio →',
  'parlay.view_receipt': 'View receipt →',
  'parlay.place_another': 'Build another',

  'portfolio.tickets': 'Parlay tickets',
  'portfolio.no_tickets': 'No parlay tickets yet. Build one from the slip.',
  'portfolio.ticket_open': 'Open',
  'portfolio.ticket_won': 'Won',
  'portfolio.ticket_lost': 'Lost',
  'portfolio.ticket_placed': 'Placed',
  'portfolio.ticket_to_win': 'To win',
  'portfolio.ticket_stake_suffix': 'stake',
  'portfolio.ticket_count_one': 'ticket',
  'portfolio.ticket_count_many': 'tickets',
  'portfolio.more_legs': 'more legs',
  'portfolio.loading': 'Loading tickets…',

  'onb.skip': 'Skip',
  'onb.next': 'Next',
  'onb.start': 'Start trading',
  /*
   * v2.27-2: Rewrote all three slides so the first-visit intro leads
   * with the two moats that actually differentiate Conviction —
   * permissionless market creation and the APAC-native evidence
   * swarm — rather than reciting Polymarket-shaped feature copy.
   *
   *   Slide 1: APAC coverage (was already in this ballpark; sharpened).
   *   Slide 2: Permissionless creation (was "AI-graded evidence", which
   *            a reader could mistake for "AI-curated markets" —
   *            rewritten to emphasize "any user proposes in 45s").
   *   Slide 3: Oracle transparency (was a gesture tutorial, which is
   *            valuable but didn't land the differentiation — moved
   *            gesture hints into the feed page's own UI and replaced
   *            this slide with the Oracle's evidence-bundle story).
   */
  'onb.1.title': 'Trade every APAC narrative',
  'onb.1.body':
    'K-pop comebacks, LCK vs LPL, NPB, Bollywood openings, anime ratings, APAC macro — every narrative 4 billion people care about, priced live in ¢.',
  'onb.2.title': 'Propose the next market in 45s',
  'onb.2.body':
    'Conviction is the only permissionless APAC prediction market. Any user proposes — 13 scrapers grade it — the best ones ship. The catalog grows at meme-speed, not curator-speed.',
  'onb.3.title': 'An Oracle you can audit',
  'onb.3.body':
    '23 evidence sources (Naver, Weverse, Weibo, Pixiv, YouTube…) + Qwen3 → Sonnet-4.6 two-stage judging + human signoff. Tap the AI dial on any market to see the sources yourself.',

  'mobnav.markets': 'Markets',
  'mobnav.feed': 'Feed',
  'mobnav.propose': 'Propose',
  'mobnav.portfolio': 'Portfolio',
  'mobnav.leaderboard': 'Ranks',

  'trader.copy': 'Copy-trade',
  'trader.copying': 'Copying',
  'trader.followers': 'followers',
  'trader.winrate': 'Win rate',
  'trader.pnl30': '30d PnL',
  'trader.aum': 'AUM',
  'trader.strategy': 'Strategy',
  'trader.recent': 'Recent picks',
  'trader.pnl_chart': '30-day PnL curve',

  'ai.title': 'Conviction Oracle',
  'ai.subtitle': 'Qwen3 · Sonnet-4.6 · 23 scrapers',
  'ai.inspect': 'Inspect evidence bundle',
  'ai.confidence': 'Confidence',
  'ai.vs_market': 'vs market',

  'evidence.title': 'Evidence Bundle',
  'evidence.verdict': 'Verdict',
  'evidence.judged': 'Judged by',
  'evidence.reasoning': 'Reasoning',
  'evidence.sources': 'Sources',
  'evidence.retrieved': 'retrieved',
  'evidence.close': 'Close',

  'newmkt.title': 'Propose a market',
  'newmkt.sub': 'Type the question. Our agents do the rest.',
  'newmkt.placeholder': 'e.g. "BLACKPINK tops Spotify Global chart in Q4 2026?"',
  'newmkt.propose': 'Run Conviction Swarm',
  'newmkt.step.parse': 'Parsing intent',
  'newmkt.step.route': 'Routing to domain stack',
  'newmkt.step.scrape': 'Fanning out 23 scrapers',
  'newmkt.step.judge': 'Qwen3 drafting verdict',
  'newmkt.step.verify': 'Sonnet-4.6 verifying',
  'newmkt.step.publish': 'Publishing market',
  'newmkt.done': 'Market draft ready',

  'agentic.title': 'Agentic Traders · Live',
  'agentic.sub': 'Autonomous on-chain quants you can copy-trade.',
  'agentic.follow': 'Follow',
  'agentic.aum': 'AUM',

  'narrative.title': 'Narrative Indices',
  'narrative.sub': 'Trade a culture thesis in one click.',
  'narrative.suite': 'Conviction Index Suite',
  'narrative.trade': 'Trade',

  'nx.live_pill': 'Narrative Index · Live',
  'nx.index_price': 'Index price',
  'nx.24h': '24h',
  'nx.basket_vol': 'Basket volume',
  'nx.liquidity': 'Liquidity',
  'nx.trade_btn': 'Trade Index',
  'nx.spawn_variant': 'Spawn variant',
  'nx.basket_constituents': 'Basket constituents',
  'nx.weighted_markets_suffix': 'weighted markets',
  'nx.total_weight': 'Total weight',
  'nx.leg_suffix': 'leg',
  'nx.conviction_h': 'Conviction on this thesis',
  'nx.traders_riding': 'Traders riding',
  'nx.agentic_quants': 'Agentic quants',
  'nx.human_conviction': 'Human conviction',
  'nx.aum_short': 'AUM',
  'nx.win_short': 'win',
  'nx.live_short': 'Live',

  'col.market': 'Market',
  'col.side': 'Side',
  'col.trader': 'Trader',
  'col.region': 'Region',
  'col.badge': 'Badge',
  'col.price': 'Price',
  'col.qty': 'Qty',
  'col.entry': 'Entry',
  'col.pnl': 'PnL',

  'debut.title': 'K-Culture Debut Calendar',
  'debut.sub': 'Upcoming drops · every big event spawns a live market.',
  'debut.create_market': 'Create market',
  'debut.view_market': 'View market',

  'vibe.title': 'Vibe Check',
  'vibe.sub': 'Cultural sentiment · 24h · Weverse + X + Instiz + Reddit',

  'mute.muted': 'Sound off',
  'mute.unmuted': 'Sound on',

  // Discovery / catalog
  'discover.search_placeholder': 'Search markets, tags, narratives…',
  'discover.search_aria': 'Search markets',
  'discover.clear_search_aria': 'Clear search',
  'discover.tags_label': 'Tags',
  'discover.showing_prefix': 'Showing',
  'discover.showing_of': 'of',
  'discover.no_matches': 'No markets match these filters.',
  'discover.clear_filters': 'Clear filters',

  // a11y group labels
  'discover.sort_group_aria': 'Sort markets',
  'discover.status_group_aria': 'Filter by status',

  // Sort chips
  'sort.trending': '🔥 Trending',
  'sort.volume': '$ Volume',
  'sort.closing': '⏱ Closing',
  'sort.edge': '⚡ Edge',
  'sort.ai': '🧠 AI conf',

  // Status toggle
  'status.live': 'Live',
  'status.settled': 'Settled',
  'status.all': 'All',

  // Live ticker
  'ticker.aria': 'Live market tape',

  // Share / parlay receipt
  'share.copy_link': 'Copy link',
  'share.copied': 'Copied ✓',
  'share.share_on_x': 'Share on X →',
  'share.build_your_own': 'Build your own →',

  // Settled state on cards
  'market.settled_final': 'Settled · final ¢',
};

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => EN[k] ?? k,
});

export function useI18n() {
  return useContext(Ctx);
}

export function useT() {
  return useContext(Ctx).t;
}

/**
 * English-only Provider. Kept as a wrapper so existing `useT()` call sites
 * stay unchanged and re-introducing a locale later is a localized edit.
 */
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const t = (k: string) => EN[k] ?? k;
  return (
    <Ctx.Provider value={{ locale: 'en', setLocale: () => {}, t }}>
      {children}
    </Ctx.Provider>
  );
}
