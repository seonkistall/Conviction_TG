import type {
  Market,
  Trader,
  PortfolioPosition,
  ActivityEvent,
  AITrader,
  NarrativeIndex,
  DebutEvent,
  VibeSignal,
  EvidenceBundle,
} from './types';

/**
 * VIDEO SOURCING STRATEGY
 * ------------------------
 * Hybrid per the product direction:
 *   1. `mp4` — short culture/sport B-roll hosted on Pexels (royalty-free)
 *      or, in production, on Conviction's own CDN (Mux/Cloudflare Stream).
 *   2. `youtube` — official YouTube video IDs. Rendered as a muted, looping
 *      iframe via youtube-nocookie for K-pop MVs & LCK highlights.
 */

export const MARKETS: Market[] = [
  {
    id: 'mkt_blackpink_2026',
    slug: 'blackpink-reunion-2026',
    title: 'BLACKPINK releases full group album in 2026?',
    description:
      'Resolves YES if BLACKPINK releases a full group (4-member) studio album or mini-album before Dec 31, 2026 11:59PM KST. Sub-unit or solo work does not count.',
    category: 'K-Pop',
    region: 'KR',
    endsAt: '2026-12-31T14:59:00Z',
    resolvesAt: '2027-01-07T00:00:00Z',
    volume: 842_310,
    liquidity: 214_000,
    traders: 3_104,
    yesProb: 0.62,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'ioNng23DkIM',
      poster: 'https://i.ytimg.com/vi/ioNng23DkIM/maxresdefault.jpg',
      start: 25,
    },
    tags: ['BLACKPINK', 'YG', 'Comeback', 'Album'],
    status: 'live',
    aiConfidence: 0.78,
    aiTrend: 'up',
    trending: true,
    edgePP: 16,
    vibe: 0.74,
  },
  {
    id: 'mkt_t1_worlds_2026',
    slug: 't1-wins-lol-worlds-2026',
    title: 'T1 wins LoL Worlds 2026?',
    description:
      "Resolves YES if T1 lifts the Summoner's Cup at the 2026 League of Legends World Championship Finals.",
    category: 'Esports',
    region: 'KR',
    endsAt: '2026-11-01T12:00:00Z',
    resolvesAt: '2026-11-15T00:00:00Z',
    volume: 1_204_920,
    liquidity: 318_400,
    traders: 5_281,
    yesProb: 0.37,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'FXpEpnT_qjU',
      poster: 'https://i.ytimg.com/vi/FXpEpnT_qjU/maxresdefault.jpg',
    },
    tags: ['LoL', 'T1', 'Faker', 'LCK'],
    status: 'live',
    aiConfidence: 0.51,
    aiTrend: 'up',
    trending: true,
    edgePP: 14,
    vibe: 0.62,
  },
  {
    id: 'mkt_worlds_winner_2026',
    slug: 'worlds-2026-winner',
    title: 'Who wins LoL Worlds 2026?',
    description:
      'Multi-outcome market on the 2026 World Championship winning team. Resolves to the team that lifts the Summoner\'s Cup.',
    category: 'Esports',
    region: 'KR',
    endsAt: '2026-11-01T12:00:00Z',
    resolvesAt: '2026-11-15T00:00:00Z',
    volume: 2_145_800,
    liquidity: 602_100,
    traders: 8_124,
    yesProb: 0.37,
    kind: 'multi',
    outcomes: [
      { id: 't1', label: 'T1 · KR', prob: 0.37, color: '#E32D2D' },
      { id: 'gen', label: 'Gen.G · KR', prob: 0.21, color: '#E5B838' },
      { id: 'hle', label: 'Hanwha Life · KR', prob: 0.11, color: '#F26B2D' },
      { id: 'blg', label: 'Bilibili · CN', prob: 0.14, color: '#00A1D6' },
      { id: 'tes', label: 'TES · CN', prob: 0.08, color: '#DC143C' },
      { id: 'fld', label: 'Field', prob: 0.09, color: '#7C5CFF' },
    ],
    media: {
      kind: 'youtube',
      src: 'FXpEpnT_qjU',
      poster: 'https://i.ytimg.com/vi/FXpEpnT_qjU/maxresdefault.jpg',
    },
    tags: ['LoL', 'Worlds', 'LCK', 'LPL'],
    status: 'live',
    aiConfidence: 0.42,
    aiTrend: 'up',
    trending: true,
    edgePP: 8,
  },
  {
    id: 'mkt_son_20goals',
    slug: 'son-heung-min-20-goals',
    title: 'Son Heung-min scores 20+ Premier League goals this season?',
    description:
      'Resolves YES if Son Heung-min records 20 or more Premier League goals in the 2025/26 season by the final matchday.',
    category: 'Sports',
    region: 'KR',
    endsAt: '2026-05-24T15:00:00Z',
    resolvesAt: '2026-05-25T00:00:00Z',
    volume: 588_100,
    liquidity: 147_000,
    traders: 2_017,
    yesProb: 0.48,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/3195531/3195531-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/3195531/free-video-3195531.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Football', 'EPL', 'Son Heung-min'],
    status: 'live',
    aiConfidence: 0.53,
    aiTrend: 'flat',
    edgePP: 5,
    vibe: 0.58,
  },
  {
    id: 'mkt_squidgame_s3',
    slug: 'squid-game-s3-100m',
    title: 'Squid Game S3 hits 100M Netflix views in week 1?',
    description:
      'Resolves YES if Squid Game Season 3 reaches 100 million official Netflix views within the first 7 days after global premiere.',
    category: 'K-Drama',
    region: 'KR',
    endsAt: '2026-09-15T04:00:00Z',
    resolvesAt: '2026-09-22T04:00:00Z',
    volume: 1_892_300,
    liquidity: 422_100,
    traders: 7_018,
    yesProb: 0.78,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/2022395/2022395-uhd_2732_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Netflix', 'Squid Game', 'K-Drama'],
    status: 'live',
    aiConfidence: 0.88,
    aiTrend: 'up',
    trending: true,
    edgePP: 10,
    vibe: 0.81,
  },
  {
    id: 'mkt_newjeans_q4',
    slug: 'newjeans-comeback-q4',
    title: 'NewJeans full-group comeback before Q4 2026 ends?',
    description:
      'Resolves YES if all 5 members of NewJeans appear together on an officially-released song by Dec 31, 2026.',
    category: 'K-Pop',
    region: 'KR',
    endsAt: '2026-12-31T14:59:00Z',
    resolvesAt: '2027-01-07T00:00:00Z',
    volume: 2_014_700,
    liquidity: 512_200,
    traders: 9_412,
    yesProb: 0.41,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'V37TaRdVUQY',
      poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
      start: 15,
    },
    tags: ['NewJeans', 'ADOR', 'HYBE'],
    status: 'live',
    aiConfidence: 0.28,
    aiTrend: 'down',
    trending: true,
    edgePP: 13,
    vibe: 0.41,
  },
  {
    id: 'mkt_mama_2026',
    slug: 'mama-daesang-2026',
    title: 'Who wins MAMA Daesang (Artist of the Year) 2026?',
    description:
      'Multi-outcome market on the Artist of the Year Grand Prize at the 2026 MAMA Awards.',
    category: 'K-Pop',
    region: 'KR',
    endsAt: '2026-12-10T11:00:00Z',
    resolvesAt: '2026-12-12T00:00:00Z',
    volume: 1_641_200,
    liquidity: 398_800,
    traders: 6_841,
    yesProb: 0.32,
    kind: 'multi',
    outcomes: [
      { id: 'bts', label: 'BTS', prob: 0.22, color: '#7C5CFF' },
      { id: 'sv', label: 'Stray Kids', prob: 0.18, color: '#FF4E4E' },
      { id: 'nj', label: 'NewJeans', prob: 0.14, color: '#AFE1E8' },
      { id: 'le', label: 'LE SSERAFIM', prob: 0.11, color: '#A0CDDB' },
      { id: 'iv', label: 'IVE', prob: 0.09, color: '#F7ABC8' },
      { id: 'ae', label: 'aespa', prob: 0.09, color: '#00D4FF' },
      { id: 'bp', label: 'BLACKPINK', prob: 0.08, color: '#FF2DA0' },
      { id: 'fld', label: 'Field', prob: 0.09, color: '#C7C4BB' },
    ],
    media: {
      kind: 'youtube',
      src: 'gdZLi9oWNZg',
      poster: 'https://i.ytimg.com/vi/gdZLi9oWNZg/maxresdefault.jpg',
    },
    tags: ['MAMA', 'K-Pop', 'Awards', 'Daesang'],
    status: 'live',
    aiConfidence: 0.26,
    aiTrend: 'up',
    trending: true,
    edgePP: 6,
    vibe: 0.77,
  },
  {
    id: 'mkt_kbo_kiwoom',
    slug: 'kiwoom-kbo-2026',
    title: 'Kiwoom Heroes win the 2026 KBO Korean Series?',
    description: 'Resolves YES if the Kiwoom Heroes win the 2026 Korean Series.',
    category: 'Sports',
    region: 'KR',
    endsAt: '2026-10-20T10:00:00Z',
    resolvesAt: '2026-11-05T00:00:00Z',
    volume: 321_880,
    liquidity: 84_200,
    traders: 1_212,
    yesProb: 0.14,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/6985329/6985329-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/6985329/free-video-6985329.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['KBO', 'Baseball', 'Kiwoom'],
    status: 'live',
    aiConfidence: 0.22,
    aiTrend: 'flat',
    edgePP: 8,
  },
  {
    id: 'mkt_btc_150k',
    slug: 'btc-150k-eoy',
    title: 'Bitcoin closes above $150,000 on Dec 31, 2026?',
    description:
      'Resolves YES if the Coinbase BTC/USD spot price at 23:59:59 UTC on 2026-12-31 is ≥ $150,000.',
    category: 'Crypto',
    region: 'GLOBAL',
    endsAt: '2026-12-31T23:59:00Z',
    resolvesAt: '2027-01-01T00:30:00Z',
    volume: 3_441_920,
    liquidity: 890_100,
    traders: 14_882,
    yesProb: 0.56,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/7989752/7989752-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/7989752/free-video-7989752.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['BTC', 'Crypto', 'Macro'],
    status: 'live',
    aiConfidence: 0.58,
    aiTrend: 'up',
    trending: true,
    edgePP: 2,
  },
  {
    id: 'mkt_one_piece_end',
    slug: 'one-piece-manga-end-2027',
    title: 'One Piece manga concludes before end of 2027?',
    description:
      'Resolves YES if Eiichiro Oda publishes the final chapter of One Piece in Weekly Shonen Jump by Dec 31, 2027.',
    category: 'Anime',
    region: 'JP',
    endsAt: '2027-12-31T14:59:00Z',
    resolvesAt: '2028-01-14T00:00:00Z',
    volume: 712_410,
    liquidity: 192_300,
    traders: 4_104,
    yesProb: 0.19,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/2034115/2034115-hd_1920_1080_30fps.mp4',
      poster:
        'https://images.pexels.com/videos/2034115/free-video-2034115.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Manga', 'Shonen Jump', 'One Piece'],
    status: 'live',
    aiConfidence: 0.23,
    aiTrend: 'flat',
    edgePP: 4,
  },
  {
    id: 'mkt_parasite_2',
    slug: 'bong-joon-ho-oscar-2027',
    title: "Bong Joon-ho's next film wins Best Picture at the 2027 Oscars?",
    description:
      'Resolves YES if the next feature film directed by Bong Joon-ho (released before Oct 15, 2026) wins Best Picture at the 99th Academy Awards.',
    category: 'Entertainment',
    region: 'KR',
    endsAt: '2027-03-05T00:00:00Z',
    resolvesAt: '2027-03-10T00:00:00Z',
    volume: 408_220,
    liquidity: 102_500,
    traders: 1_884,
    yesProb: 0.09,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/2795405/2795405-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/2795405/free-video-2795405.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Oscars', 'Bong Joon-ho', 'Film'],
    status: 'live',
    aiConfidence: 0.11,
    aiTrend: 'down',
    edgePP: 2,
  },
  {
    id: 'mkt_nikkei_50k',
    slug: 'nikkei-50000',
    title: 'Nikkei 225 closes above 50,000 in 2026?',
    description:
      'Resolves YES if the Nikkei 225 has at least one daily closing print ≥ 50,000 between Jan 1, 2026 and Dec 31, 2026.',
    category: 'Finance',
    region: 'JP',
    endsAt: '2026-12-31T06:00:00Z',
    resolvesAt: '2027-01-05T00:00:00Z',
    volume: 912_440,
    liquidity: 228_100,
    traders: 3_421,
    yesProb: 0.64,
    kind: 'binary',
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/3873059/3873059-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/3873059/free-video-3873059.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Nikkei', 'Japan', 'Macro'],
    status: 'live',
    aiConfidence: 0.69,
    aiTrend: 'up',
    edgePP: 5,
  },
  {
    id: 'mkt_bts_full',
    slug: 'bts-full-group-tour-2026',
    title: 'BTS announces full 7-member world tour in 2026?',
    description:
      'Resolves YES if BIGHIT MUSIC officially announces a world tour featuring all 7 members of BTS before Dec 31, 2026.',
    category: 'K-Pop',
    region: 'KR',
    endsAt: '2026-12-31T14:59:00Z',
    resolvesAt: '2027-01-10T00:00:00Z',
    volume: 2_881_900,
    liquidity: 712_300,
    traders: 12_401,
    yesProb: 0.73,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'gdZLi9oWNZg',
      poster: 'https://i.ytimg.com/vi/gdZLi9oWNZg/maxresdefault.jpg',
      start: 40,
    },
    tags: ['BTS', 'HYBE', 'Tour'],
    status: 'live',
    aiConfidence: 0.88,
    aiTrend: 'up',
    trending: true,
    edgePP: 15,
    vibe: 0.89,
  },
  {
    id: 'mkt_korea_election',
    slug: 'korea-president-2027',
    title: 'Who wins the 2027 Korean presidential election?',
    description:
      'Multi-outcome market on the winner of the 21st Korean presidential election in March 2027.',
    category: 'Politics',
    region: 'KR',
    endsAt: '2027-03-03T15:00:00Z',
    resolvesAt: '2027-03-10T00:00:00Z',
    volume: 1_428_220,
    liquidity: 361_400,
    traders: 5_932,
    yesProb: 0.46,
    kind: 'multi',
    outcomes: [
      { id: 'dem', label: 'Democratic Party (민주)', prob: 0.46, color: '#004EA2' },
      { id: 'ppp', label: 'People Power (국민의힘)', prob: 0.38, color: '#E61E2B' },
      { id: 'rn', label: 'Rebuild Korea (조국혁신)', prob: 0.08, color: '#007F3F' },
      { id: 'ind', label: 'Independent', prob: 0.05, color: '#7C5CFF' },
      { id: 'fld', label: 'Other', prob: 0.03, color: '#C7C4BB' },
    ],
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/7722272/7722272-uhd_2560_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/7722272/free-video-7722272.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
    tags: ['Korea', 'Election', 'Politics', '2027'],
    status: 'live',
    aiConfidence: 0.53,
    aiTrend: 'flat',
    edgePP: 7,
  },
];

export function getMarket(idOrSlug: string): Market | undefined {
  return MARKETS.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
}

export function getAITrader(handle: string): AITrader | undefined {
  return AI_TRADERS.find((t) => t.handle === handle || t.id === handle);
}

export const TRENDING_MARKETS: Market[] = MARKETS.filter((m) => m.trending);

export const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'K-Pop', value: 'K-Pop' },
  { label: 'K-Drama', value: 'K-Drama' },
  { label: 'Esports', value: 'Esports' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Anime', value: 'Anime' },
  { label: 'Crypto', value: 'Crypto' },
  { label: 'Finance', value: 'Finance' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Politics', value: 'Politics' },
];

// --------- Traders / Leaderboard ----------

export const TRADERS: Trader[] = [
  { id: 'u_01', handle: 'oracle.seoul', avatar: '🧠', region: 'KR', pnl30d: 142_882, winRate: 0.71, volume30d: 1_820_000, streak: 12, badge: 'oracle' },
  { id: 'u_02', handle: 'bias.jp', avatar: '🎌', region: 'JP', pnl30d: 118_401, winRate: 0.68, volume30d: 1_411_200, streak: 8, badge: 'culture' },
  { id: 'u_03', handle: 'faker.fanboy', avatar: '🎮', region: 'KR', pnl30d: 92_150, winRate: 0.64, volume30d: 910_000, streak: 5, badge: 'sniper' },
  { id: 'u_04', handle: 'whale.apac', avatar: '🐋', region: 'APAC', pnl30d: 88_900, winRate: 0.58, volume30d: 4_210_000, streak: 2, badge: 'whale' },
  { id: 'u_05', handle: 'idol.scout', avatar: '💜', region: 'KR', pnl30d: 72_300, winRate: 0.66, volume30d: 612_000, streak: 6, badge: 'culture' },
  { id: 'u_06', handle: 'btc.maxi.hk', avatar: '🟧', region: 'APAC', pnl30d: 64_110, winRate: 0.61, volume30d: 1_120_000, streak: 4 },
  { id: 'u_07', handle: 'drama.nerd', avatar: '📺', region: 'KR', pnl30d: 48_210, winRate: 0.62, volume30d: 412_000, streak: 3, badge: 'culture' },
  { id: 'u_08', handle: 'tokyo.takes', avatar: '🗼', region: 'JP', pnl30d: 38_900, winRate: 0.55, volume30d: 381_200, streak: 1 },
  { id: 'u_09', handle: 'sea.contrarian', avatar: '🏝️', region: 'SEA', pnl30d: 31_800, winRate: 0.59, volume30d: 244_100, streak: 7 },
  { id: 'u_10', handle: 'kbo.quant', avatar: '⚾', region: 'KR', pnl30d: 28_400, winRate: 0.57, volume30d: 198_300, streak: 2 },
];

// --------- AI Traders (Agentic Marketplace) ----------

export const AI_TRADERS: AITrader[] = [
  {
    id: 'ai_01',
    handle: 'ai.oracle.kr',
    avatar: '🤖',
    model: 'Conviction-v2',
    strategy: 'K-Pop / K-Drama edge from Weverse + Naver sentiment',
    pnl30d: 88_214,
    winRate: 0.74,
    aum: 412_800,
    followers: 1_284,
    region: 'KR',
    live: true,
  },
  {
    id: 'ai_02',
    handle: 'allora.lck',
    avatar: '🛰️',
    model: 'Allora-KR',
    strategy: 'LCK/LPL draft-state + patch-metric quant',
    pnl30d: 62_900,
    winRate: 0.69,
    aum: 301_200,
    followers: 892,
    region: 'KR',
    live: true,
  },
  {
    id: 'ai_03',
    handle: 'qwen.drama',
    avatar: '🎬',
    model: 'Qwen3-32B',
    strategy: 'Ratings + streaming-retention prior over Netflix/Wavve',
    pnl30d: 41_100,
    winRate: 0.67,
    aum: 188_000,
    followers: 621,
    region: 'KR',
    live: true,
  },
  {
    id: 'ai_04',
    handle: 'sonnet.macro',
    avatar: '🧠',
    model: 'Sonnet-4.6',
    strategy: 'Asia macro — BOJ/PBOC/BOK policy diff',
    pnl30d: 51_800,
    winRate: 0.61,
    aum: 622_500,
    followers: 438,
    region: 'APAC',
    live: true,
  },
  {
    id: 'ai_05',
    handle: 'ai.vibe.jp',
    avatar: '🗼',
    model: 'Conviction-v2',
    strategy: 'J-Pop / anime sentiment · Weibo + 2ch crossfeed',
    pnl30d: 22_400,
    winRate: 0.58,
    aum: 94_100,
    followers: 211,
    region: 'JP',
    live: false,
  },
];

// --------- Narrative Indices (curated basket markets) ----------

export const NARRATIVE_INDICES: NarrativeIndex[] = [
  {
    id: 'nx_kpop_big4',
    slug: 'kpop-big4-2026',
    title: 'K-Pop Big 4 · FY26',
    blurb: 'Weighted basket of BTS · BLACKPINK · NewJeans · aespa comeback markets.',
    emoji: '💜',
    legs: [
      { marketId: 'mkt_bts_full', weight: 0.35 },
      { marketId: 'mkt_blackpink_2026', weight: 0.3 },
      { marketId: 'mkt_newjeans_q4', weight: 0.2 },
      { marketId: 'mkt_mama_2026', weight: 0.15 },
    ],
    price: 0.58,
    change24h: 2.4,
    media: {
      kind: 'youtube',
      src: 'gdZLi9oWNZg',
      poster: 'https://i.ytimg.com/vi/gdZLi9oWNZg/maxresdefault.jpg',
      start: 30,
    },
  },
  {
    id: 'nx_lck_dominance',
    slug: 'lck-dominance-2026',
    title: 'LCK Dominance Index',
    blurb: 'Weighted probability that an LCK team wins Worlds + MSI + any major international title.',
    emoji: '🎮',
    legs: [
      { marketId: 'mkt_t1_worlds_2026', weight: 0.55 },
      { marketId: 'mkt_worlds_winner_2026', weight: 0.45 },
    ],
    price: 0.64,
    change24h: -1.2,
    media: {
      kind: 'youtube',
      src: 'FXpEpnT_qjU',
      poster: 'https://i.ytimg.com/vi/FXpEpnT_qjU/maxresdefault.jpg',
    },
  },
  {
    id: 'nx_hallyu_global',
    slug: 'hallyu-goes-global-2027',
    title: 'Hallyu Goes Global',
    blurb: 'Squid Game S3 · Bong Oscar · BTS tour — the case that Korean culture peaks in 2026.',
    emoji: '🌏',
    legs: [
      { marketId: 'mkt_squidgame_s3', weight: 0.4 },
      { marketId: 'mkt_parasite_2', weight: 0.25 },
      { marketId: 'mkt_bts_full', weight: 0.35 },
    ],
    price: 0.71,
    change24h: 3.8,
    media: {
      kind: 'mp4',
      src: 'https://videos.pexels.com/video-files/2022395/2022395-uhd_2732_1440_25fps.mp4',
      poster:
        'https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&cs=tinysrgb&w=1280',
    },
  },
];

// --------- K-Culture Debut Calendar ----------

export const DEBUT_EVENTS: DebutEvent[] = [
  {
    id: 'db_01',
    artist: 'HYBE New Boy Group (TBA)',
    title: 'HYBE next boy-group debut',
    company: 'HYBE',
    dropsAt: '2026-05-15T09:00:00Z',
    heat: 0.82,
    poster: 'https://i.ytimg.com/vi/gdZLi9oWNZg/maxresdefault.jpg',
  },
  {
    id: 'db_02',
    artist: 'aespa',
    title: 'aespa · Armageddon World Tour announcement',
    company: 'SM',
    dropsAt: '2026-05-01T10:00:00Z',
    heat: 0.71,
    poster: 'https://i.ytimg.com/vi/ioNng23DkIM/maxresdefault.jpg',
  },
  {
    id: 'db_03',
    artist: 'BLACKPINK',
    title: 'BLACKPINK full-group comeback (YG)',
    marketId: 'mkt_blackpink_2026',
    company: 'YG',
    dropsAt: '2026-06-21T00:00:00Z',
    heat: 0.91,
    poster: 'https://i.ytimg.com/vi/ioNng23DkIM/maxresdefault.jpg',
  },
  {
    id: 'db_04',
    artist: 'ADOR',
    title: 'NewJeans 5-member reunion (post-ADOR ruling)',
    marketId: 'mkt_newjeans_q4',
    company: 'ADOR',
    dropsAt: '2026-09-01T00:00:00Z',
    heat: 0.88,
    poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
  },
  {
    id: 'db_05',
    artist: 'JYP · Next Gen',
    title: 'JYP new global girl-group debut',
    company: 'JYP',
    dropsAt: '2026-07-11T09:00:00Z',
    heat: 0.64,
    poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
  },
  {
    id: 'db_06',
    artist: 'YG · Sub-Unit',
    title: 'Jennie solo world tour announcement',
    company: 'YG',
    dropsAt: '2026-08-01T00:00:00Z',
    heat: 0.69,
    poster: 'https://i.ytimg.com/vi/ioNng23DkIM/maxresdefault.jpg',
  },
];

// --------- Vibe signals (cultural sentiment) ----------

export const VIBE_SIGNALS: VibeSignal[] = [
  {
    topic: 'BLACKPINK reunion',
    score: 0.82,
    volume: 412_800,
    sources: ['weverse', 'x', 'instiz', 'reddit'],
    sparkline: [0.3, 0.35, 0.41, 0.47, 0.52, 0.58, 0.61, 0.64, 0.68, 0.72, 0.75, 0.76, 0.77, 0.78, 0.79, 0.8, 0.81, 0.82, 0.82, 0.82, 0.82, 0.82, 0.82, 0.82],
  },
  {
    topic: 'Squid Game S3',
    score: 0.74,
    volume: 288_420,
    sources: ['x', 'reddit', 'youtube'],
    sparkline: [0.5, 0.52, 0.55, 0.58, 0.6, 0.63, 0.65, 0.67, 0.68, 0.7, 0.71, 0.72, 0.72, 0.73, 0.73, 0.74, 0.74, 0.74, 0.74, 0.74, 0.74, 0.74, 0.74, 0.74],
  },
  {
    topic: 'T1 Worlds pick',
    score: 0.61,
    volume: 188_100,
    sources: ['x', 'reddit', 'instiz'],
    sparkline: [0.4, 0.42, 0.45, 0.47, 0.48, 0.5, 0.52, 0.54, 0.55, 0.56, 0.57, 0.58, 0.59, 0.6, 0.6, 0.61, 0.61, 0.61, 0.61, 0.61, 0.61, 0.61, 0.61, 0.61],
  },
  {
    topic: 'NewJeans reunion',
    score: 0.28,
    volume: 602_100,
    sources: ['weverse', 'x', 'instiz'],
    sparkline: [0.62, 0.6, 0.58, 0.55, 0.52, 0.49, 0.46, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.33, 0.32, 0.31, 0.3, 0.29, 0.28, 0.28, 0.28, 0.28, 0.28, 0.28],
  },
];

// --------- Evidence bundles ----------

export const EVIDENCE_BUNDLES: Record<string, EvidenceBundle> = {
  mkt_bts_full: {
    marketId: 'mkt_bts_full',
    verdict: 'YES',
    confidence: 0.88,
    judgedBy: 'Sonnet-4.6',
    reasoning:
      'All 7 BTS members have now completed mandatory military service as of June 2025. BIGHIT MUSIC statements + HYBE FY26 earnings guidance point to "major group activity in second half". Concert venue booking data (Seoul/Tokyo/LA) confirms tour-scale infrastructure holds.',
    sources: [
      { id: 's1', title: 'HYBE Q4-25 earnings — "full BTS activity in H2 2026"', url: 'https://hybecorp.com/ir', provider: 'Brave', confidence: 0.93, excerpt: 'CFO Park: "We are preparing for group activity, timing centered on second half."', retrievedAt: '2026-04-21T09:42:00Z' },
      { id: 's2', title: 'Jungkook mil. service discharge — YNA 2025-06-11', url: 'https://yna.co.kr/view/BTS', provider: 'Naver', confidence: 0.99, excerpt: 'Final member discharged, clearing all 7-member activity gates.', retrievedAt: '2026-04-20T12:00:00Z' },
      { id: 's3', title: 'Weverse fan-group sentiment — BTS reunion spike', url: 'https://weverse.io', provider: 'Weverse', confidence: 0.78, excerpt: '42% WoW increase in reunion-themed posts and concert anticipation.', retrievedAt: '2026-04-22T06:11:00Z' },
      { id: 's4', title: 'LA SoFi Stadium · APAC holds — ticketing source', url: 'https://tm.com', provider: 'Exa', confidence: 0.71, excerpt: '6-date block reserved under "K-Pop · Q4-26" — scale consistent with BTS-tier.', retrievedAt: '2026-04-21T14:19:00Z' },
      { id: 's5', title: 'Domain RAG — tour announcement base rate', url: 'internal://chroma', provider: 'RAG', confidence: 0.82, excerpt: 'Historical base-rate given combined signals: 0.84 (n=17, 2010-2024).', retrievedAt: '2026-04-22T06:30:00Z' },
    ],
  },
  mkt_blackpink_2026: {
    marketId: 'mkt_blackpink_2026',
    verdict: 'YES',
    confidence: 0.78,
    judgedBy: 'Sonnet-4.6',
    reasoning:
      'YG stock gap-up on Apr-04 after rumor of "BLACKPINK IN YOUR AREA" teaser. Teddy Park writing credits surface on APRA-AMCOS for Q3-26 releases. All 4 members re-contracted for group work per YG IR.',
    sources: [
      { id: 's1', title: 'YG Entertainment FY26 IR · "BLACKPINK group album confirmed"', url: 'https://ygfamily.com/ir', provider: 'Brave', confidence: 0.88, excerpt: 'Group album planned within fiscal year 2026.', retrievedAt: '2026-04-22T08:00:00Z' },
      { id: 's2', title: 'Teddy Park credits — APRA-AMCOS registry', url: 'https://apra.com.au', provider: 'Exa', confidence: 0.72, excerpt: '2 new tracks registered to YG/THEBLACKLABEL publishing.', retrievedAt: '2026-04-21T00:00:00Z' },
      { id: 's3', title: 'Weverse BLACKPINK fan-growth +38% MoM', url: 'https://weverse.io', provider: 'Weverse', confidence: 0.74, excerpt: 'Tour & album anticipation posts saturate top-10 trending.', retrievedAt: '2026-04-22T06:00:00Z' },
      { id: 's4', title: 'Instiz — BLACKPINK comeback rumor thread', url: 'https://instiz.net', provider: 'Naver', confidence: 0.58, excerpt: 'Multiple industry insiders on comeback timing — to be taken with caution.', retrievedAt: '2026-04-21T23:15:00Z' },
    ],
  },
  mkt_newjeans_q4: {
    marketId: 'mkt_newjeans_q4',
    verdict: 'NO',
    confidence: 0.62,
    judgedBy: 'Qwen3-32B',
    reasoning:
      'Seoul Central District Court ruling (Mar 2026) held 5 members bound to ADOR contract, but the factual reunification + Q4 single release is highly uncertain. Min Hee-jin not reinstated. Public schedule conflicts remain.',
    sources: [
      { id: 's1', title: 'Seoul Court · ADOR vs NewJeans ruling', url: 'https://scourt.go.kr', provider: 'Brave', confidence: 0.96, excerpt: 'Members remain contractually bound through 2029.', retrievedAt: '2026-03-18T00:00:00Z' },
      { id: 's2', title: 'Weverse sentiment — NewJeans', url: 'https://weverse.io', provider: 'Weverse', confidence: 0.68, excerpt: 'Anti-reunion sentiment dominant in KR + SEA clusters.', retrievedAt: '2026-04-22T06:00:00Z' },
      { id: 's3', title: 'Industry RAG — group-split resolution base-rate', url: 'internal://chroma', provider: 'RAG', confidence: 0.61, excerpt: 'Historical: 38% of litigated group splits resolve within 12 months.', retrievedAt: '2026-04-22T06:30:00Z' },
    ],
  },
  mkt_squidgame_s3: {
    marketId: 'mkt_squidgame_s3',
    verdict: 'YES',
    confidence: 0.88,
    judgedBy: 'Sonnet-4.6',
    reasoning: 'S1 hit 265M views in week 1 (2021). S2 hit 487M in week 1 (2024). S3 retention assumption → conservative 100M is the tail case, not the base.',
    sources: [
      { id: 's1', title: 'Netflix Top-10 archive — S2 week-1 487M', url: 'https://top10.netflix.com', provider: 'Brave', confidence: 0.98, excerpt: 'Official Netflix week-1 figures for S1 and S2.', retrievedAt: '2026-04-21T10:00:00Z' },
      { id: 's2', title: 'Parrot Analytics — S3 pre-release demand index', url: 'https://parrotanalytics.com', provider: 'Exa', confidence: 0.83, excerpt: '94th pct global demand vs drama category.', retrievedAt: '2026-04-22T05:15:00Z' },
    ],
  },
};

// --------- Portfolio (demo user) ----------

export const CURRENT_USER = {
  handle: 'you.apac',
  avatar: '🫵',
  region: 'KR' as const,
  totalValue: 12_842,
  available: 3_210,
  pnlAllTime: 4_214,
  pnl30d: 1_821,
};

export const PORTFOLIO: PortfolioPosition[] = [
  { marketId: 'mkt_bts_full', side: 'YES', shares: 420, avgPrice: 0.62, currentPrice: 0.73, pnl: 420 * (0.73 - 0.62) },
  { marketId: 'mkt_squidgame_s3', side: 'YES', shares: 600, avgPrice: 0.71, currentPrice: 0.78, pnl: 600 * (0.78 - 0.71) },
  { marketId: 'mkt_t1_worlds_2026', side: 'NO', shares: 300, avgPrice: 0.58, currentPrice: 0.63, pnl: 300 * (0.63 - 0.58) },
  { marketId: 'mkt_btc_150k', side: 'YES', shares: 210, avgPrice: 0.49, currentPrice: 0.56, pnl: 210 * (0.56 - 0.49) },
  { marketId: 'mkt_newjeans_q4', side: 'NO', shares: 180, avgPrice: 0.55, currentPrice: 0.59, pnl: 180 * (0.59 - 0.55) },
];

export const ACTIVITY: ActivityEvent[] = [
  { id: 'a1', type: 'trade', at: '2026-04-22T06:11:02Z', marketId: 'mkt_bts_full', detail: 'Bought YES · 120 shares @ 0.71', amount: 85.2 },
  { id: 'a2', type: 'resolve', at: '2026-04-20T12:02:00Z', marketId: 'mkt_parasite_2', detail: 'Market resolved NO · You held NO', amount: 142 },
  { id: 'a3', type: 'trade', at: '2026-04-18T03:45:00Z', marketId: 'mkt_squidgame_s3', detail: 'Bought YES · 220 shares @ 0.76', amount: 167.2 },
  { id: 'a4', type: 'follow', at: '2026-04-16T22:10:00Z', detail: 'Started following @oracle.seoul' },
  { id: 'a5', type: 'create', at: '2026-04-14T10:30:00Z', marketId: 'mkt_newjeans_q4', detail: 'Proposed market: "NewJeans full-group comeback before Q4 2026 ends?"' },
];

// --------- Helper price history ----------

export function priceHistory(seed: number, days = 30): number[] {
  const out: number[] = [];
  let v = 0.5 + ((seed * 7) % 30) / 100;
  for (let i = 0; i < days; i++) {
    const delta = (Math.sin(i * 0.4 + seed) + Math.cos(i * 0.9 + seed * 1.7)) * 0.03;
    v = Math.max(0.02, Math.min(0.98, v + delta));
    out.push(v);
  }
  return out;
}
