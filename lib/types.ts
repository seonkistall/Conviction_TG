export type MarketCategory =
  | 'K-Pop'
  | 'K-Drama'
  | 'Esports'
  | 'Sports'
  | 'Crypto'
  | 'Anime'
  | 'Politics'
  | 'Entertainment'
  | 'Finance';

export type MediaKind = 'mp4' | 'youtube';

export interface MediaSource {
  kind: MediaKind;
  /**
   * For mp4: direct MP4 URL (Pexels/Coverr/own CDN)
   * For youtube: YouTube video ID (Shorts or regular)
   */
  src: string;
  poster: string;
  /** optional seek-in for videos to skip intros */
  start?: number;
}

export type MarketStatus = 'live' | 'closing-soon' | 'resolving' | 'resolved';

export interface Outcome {
  id: string;
  label: string;
  /** 0..1 implied probability */
  prob: number;
  /** Optional color — else auto-palette */
  color?: string;
}

/** Market kind: binary YES/NO or N-outcome categorical */
export type MarketKind = 'binary' | 'multi';

export interface Market {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: MarketCategory;
  region: 'KR' | 'JP' | 'CN' | 'SEA' | 'APAC' | 'GLOBAL';
  endsAt: string; // ISO
  resolvesAt: string; // ISO
  volume: number; // USD
  liquidity: number;
  traders: number;
  yesProb: number; // 0..1 — for multi markets this is the TOP outcome prob
  kind: MarketKind;
  outcomes?: Outcome[]; // present for multi-outcome markets
  media: MediaSource;
  tags: string[];
  status: MarketStatus;
  aiConfidence: number; // 0..1 Allora / Conviction AI
  aiTrend: 'up' | 'down' | 'flat';
  trending?: boolean;
  /** Pre-computed edge pp (e.g. 13 = AI sees 13pp mispricing) */
  edgePP?: number;
  /** Cultural vibe score 0..1 from Weverse/K-Twitter aggregator */
  vibe?: number;
  // ---------- Resolution fields (status === 'resolved') ----------
  /** For binary markets: 'YES' | 'NO'. For multi: the winning outcome id. */
  resolvedOutcome?: 'YES' | 'NO' | string;
  /** Final settlement price (0..1) paid to the winning side. */
  closePrice?: number;
  /** ISO timestamp at which the oracle signed the resolution. */
  resolvedAt?: string;
  /** Short human-readable explainer shown on the resolution banner. */
  resolutionNote?: string;
}

export interface Trader {
  id: string;
  handle: string;
  avatar: string;
  region: 'KR' | 'JP' | 'SEA' | 'APAC' | 'GLOBAL';
  pnl30d: number;
  winRate: number;
  volume30d: number;
  streak: number;
  badge?: 'oracle' | 'culture' | 'sniper' | 'whale';
}

/** Autonomous AI trader (Allora / Conviction-trained) running live on-chain. */
export interface AITrader {
  id: string;
  handle: string; // @ai.oracle
  avatar: string;
  model: 'Qwen3-32B' | 'Sonnet-4.6' | 'Allora-KR' | 'Conviction-v2';
  strategy: string; // 1-line pitch
  pnl30d: number;
  winRate: number;
  aum: number; // USD under management
  followers: number;
  region: 'KR' | 'JP' | 'SEA' | 'APAC' | 'GLOBAL';
  live: boolean;
}

export interface PortfolioPosition {
  marketId: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number; // 0..1
  currentPrice: number; // 0..1
  pnl: number;
}

export interface ActivityEvent {
  id: string;
  type: 'trade' | 'resolve' | 'create' | 'follow';
  at: string;
  marketId?: string;
  detail: string;
  amount?: number;
}

// v2.22-1: Parlay types removed. Parlay was dropped from the product
// (users found the "stack theses into one ticket" mechanic confusing
// and it diluted the direct-trade positioning). Positions + OrderBook
// are now the only trade path.

// ---------- Narrative Index / Culture moats ----------

/** A weighted basket of markets sold as a single tradable narrative. */
export interface NarrativeIndex {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  emoji: string;
  /** Array of { marketId, weight 0..1 }. Sum ~1.0 */
  legs: { marketId: string; weight: number }[];
  price: number; // synthetic 0..1
  change24h: number; // % pts
  media?: MediaSource;
}

/**
 * A scheduled APAC cultural drop that auto-spawns a market.
 *
 * v2.22-3: Expanded from K-only studios to full APAC coverage — K-pop
 * labels still there, plus JP anime/film houses, C-drama platforms,
 * Bollywood studios, SEA esports orgs. `region` disambiguates events
 * from studios that publish multi-territory (e.g. Netflix).
 */
export interface DebutEvent {
  id: string;
  artist: string;
  title: string; // "NewJeans FY26 comeback"
  company:
    // Korea — music
    | 'HYBE'
    | 'SM'
    | 'YG'
    | 'JYP'
    | 'ADOR'
    // Japan — anime / music / film
    | 'MAPPA'
    | 'ufotable'
    | 'Aniplex'
    | 'Toho'
    | 'Sony Music JP'
    // China — drama / esports
    | 'Tencent'
    | 'iQiyi'
    | 'JDG'
    // India — film
    | 'YRF'
    | 'Dharma'
    // SEA — esports / streaming
    | 'MOONTON'
    | 'GMA'
    // Catch-all
    | 'Other';
  region: 'KR' | 'JP' | 'CN' | 'IN' | 'SEA' | 'APAC';
  dropsAt: string; // ISO
  heat: number; // 0..1 anticipation
  marketId?: string; // auto-spawned market
  poster: string;
}

/** Cultural sentiment signal scraped from Weverse / K-Twitter / Reddit. */
export interface VibeSignal {
  topic: string; // "BLACKPINK reunion"
  score: number; // -1..+1
  volume: number; // mentions / 24h
  sources: ('weverse' | 'x' | 'reddit' | 'youtube' | 'instiz')[];
  sparkline: number[]; // 24 points 0..1
}

// ---------- Evidence bundle ----------

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  provider: 'Brave' | 'Exa' | 'CoinGecko' | 'TheSportsDB' | 'Naver' | 'Weverse' | 'RAG';
  confidence: number; // 0..1
  excerpt: string;
  retrievedAt: string;
}

export interface EvidenceBundle {
  marketId: string;
  sources: EvidenceSource[];
  verdict: 'YES' | 'NO' | 'INCONCLUSIVE';
  confidence: number;
  reasoning: string;
  /** Which model produced the final judgment */
  judgedBy: 'Qwen3-32B' | 'Sonnet-4.6';
}
