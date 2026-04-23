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
    category: 'Music',
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
      src: 'AOTfM6H8XOo',
      poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
      start: 8,
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
      src: '5FrhtahQiRc',
      poster: 'https://i.ytimg.com/vi/5FrhtahQiRc/maxresdefault.jpg',
      start: 30,
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
      kind: 'youtube',
      src: '1MFylXgM7BM',
      poster: 'https://i.ytimg.com/vi/1MFylXgM7BM/maxresdefault.jpg',
      start: 18,
    },
    tags: ['Football', 'EPL', 'Son Heung-min'],
    status: 'resolved',
    aiConfidence: 0.53,
    aiTrend: 'flat',
    edgePP: 5,
    vibe: 0.58,
    resolvedOutcome: 'YES',
    closePrice: 1,
    resolvedAt: '2026-05-24T19:35:00Z',
    resolutionNote:
      'Son scored his 20th on the final matchday. Oracle confirmed via Premier League + TheSportsDB.',
  },
  {
    id: 'mkt_squidgame_s3',
    slug: 'squid-game-s3-100m',
    title: 'Squid Game S3 hits 100M Netflix views in week 1?',
    description:
      'Resolves YES if Squid Game Season 3 reaches 100 million official Netflix views within the first 7 days after global premiere.',
    category: 'Film & TV',
    region: 'KR',
    endsAt: '2026-09-15T04:00:00Z',
    resolvesAt: '2026-09-22T04:00:00Z',
    volume: 1_892_300,
    liquidity: 422_100,
    traders: 7_018,
    yesProb: 0.78,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '0C5rGB5VtdQ',
      poster: 'https://i.ytimg.com/vi/0C5rGB5VtdQ/maxresdefault.jpg',
      start: 5,
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
    category: 'Music',
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
    category: 'Music',
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
      kind: 'youtube',
      src: 'BAaqCYwZQjM',
      poster: 'https://i.ytimg.com/vi/BAaqCYwZQjM/maxresdefault.jpg',
    },
    tags: ['KBO', 'Baseball', 'Kiwoom'],
    status: 'resolved',
    aiConfidence: 0.22,
    aiTrend: 'flat',
    resolvedOutcome: 'NO',
    closePrice: 0,
    resolvedAt: '2026-11-11T14:08:00Z',
    resolutionNote:
      'Kiwoom eliminated in the semifinal round. Oracle confirmed via KBO official + Naver Sports.',
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
      kind: 'youtube',
      src: '5zeg52IGlaA',
      poster: 'https://i.ytimg.com/vi/5zeg52IGlaA/maxresdefault.jpg',
      start: 3,
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
    category: 'Film & TV',
    region: 'JP',
    endsAt: '2027-12-31T14:59:00Z',
    resolvesAt: '2028-01-14T00:00:00Z',
    volume: 712_410,
    liquidity: 192_300,
    traders: 4_104,
    yesProb: 0.19,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '2AcB6iWcL24',
      poster: 'https://i.ytimg.com/vi/2AcB6iWcL24/maxresdefault.jpg',
      start: 4,
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
    category: 'Film & TV',
    region: 'KR',
    endsAt: '2027-03-05T00:00:00Z',
    resolvesAt: '2027-03-10T00:00:00Z',
    volume: 408_220,
    liquidity: 102_500,
    traders: 1_884,
    yesProb: 0.09,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '5xH0HfJHsaY',
      poster: 'https://i.ytimg.com/vi/5xH0HfJHsaY/maxresdefault.jpg',
      start: 30,
    },
    tags: ['Oscars', 'Bong Joon-ho', 'Film'],
    status: 'resolved',
    aiConfidence: 0.11,
    aiTrend: 'down',
    edgePP: 2,
    resolvedOutcome: 'NO',
    closePrice: 0,
    resolvedAt: '2027-03-10T04:22:00Z',
    resolutionNote:
      'Best Picture went to another film. Oracle confirmed via Academy broadcast + Exa.',
  },
  {
    id: 'mkt_nikkei_50k',
    slug: 'nikkei-50000',
    title: 'Nikkei 225 closes above 50,000 in 2026?',
    description:
      'Resolves YES if the Nikkei 225 has at least one daily closing print ≥ 50,000 between Jan 1, 2026 and Dec 31, 2026.',
    category: 'Markets',
    region: 'JP',
    endsAt: '2026-12-31T06:00:00Z',
    resolvesAt: '2027-01-05T00:00:00Z',
    volume: 912_440,
    liquidity: 228_100,
    traders: 3_421,
    yesProb: 0.64,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '43EPmlTiSxo',
      poster: 'https://i.ytimg.com/vi/43EPmlTiSxo/maxresdefault.jpg',
      start: 2,
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
    category: 'Music',
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
  // ------------------------------ CHINA ------------------------------
  {
    id: 'mkt_jaychou_album_2026',
    slug: 'jay-chou-new-album-2026',
    title: 'Jay Chou (周杰倫) releases a full studio album in 2026?',
    description:
      'Resolves YES if Jay Chou officially releases a new full-length studio album (≥ 8 tracks) via JVR Music before Dec 31, 2026 23:59 CST. Single tracks, re-masters, and live albums do not count.',
    category: 'Music',
    region: 'CN',
    endsAt: '2026-12-31T15:59:00Z',
    resolvesAt: '2027-01-10T00:00:00Z',
    volume: 612_400,
    liquidity: 158_200,
    traders: 2_142,
    yesProb: 0.34,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '2kdYSeoHChg',
      poster: 'https://i.ytimg.com/vi/2kdYSeoHChg/maxresdefault.jpg',
      start: 40,
    },
    tags: ['C-Pop', 'Jay Chou', 'JVR', 'China'],
    status: 'live',
    aiConfidence: 0.41,
    aiTrend: 'up',
    trending: true,
    edgePP: 7,
    vibe: 0.66,
  },
  {
    id: 'mkt_cdrama_joyofreign',
    slug: 'joy-of-life-s3-rating',
    title: 'Joy of Life S3 (慶餘年) averages ≥ 8.5 on Douban?',
    description:
      'Resolves YES if the Douban audience score for Joy of Life Season 3 is ≥ 8.5 at the end of its full broadcast run on Tencent Video / WeTV.',
    category: 'Film & TV',
    region: 'CN',
    endsAt: '2026-11-30T16:00:00Z',
    resolvesAt: '2026-12-15T00:00:00Z',
    volume: 488_200,
    liquidity: 121_400,
    traders: 1_892,
    yesProb: 0.58,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '8D5AyJAXqiE',
      poster: 'https://i.ytimg.com/vi/8D5AyJAXqiE/maxresdefault.jpg',
      start: 8,
    },
    tags: ['C-Drama', 'Tencent', 'Douban', 'China'],
    status: 'live',
    aiConfidence: 0.66,
    aiTrend: 'up',
    edgePP: 8,
    vibe: 0.71,
  },
  {
    id: 'mkt_lpl_spring_2026',
    slug: 'lpl-spring-2026-winner',
    title: 'Who wins LPL Spring 2026?',
    description:
      'Multi-outcome market on the champion of the LoL Pro League Spring 2026 split. Resolves to the team that lifts the LPL Spring trophy.',
    category: 'Esports',
    region: 'CN',
    endsAt: '2026-05-03T12:00:00Z',
    resolvesAt: '2026-05-05T00:00:00Z',
    volume: 1_380_200,
    liquidity: 344_100,
    traders: 5_821,
    yesProb: 0.33,
    kind: 'multi',
    outcomes: [
      { id: 'jdg', label: 'JD Gaming', prob: 0.33, color: '#E62A2E' },
      { id: 'blg', label: 'Bilibili Gaming', prob: 0.27, color: '#00A1D6' },
      { id: 'wbg', label: 'Weibo Gaming', prob: 0.13, color: '#FF6B00' },
      { id: 'tes', label: 'Top Esports', prob: 0.11, color: '#DC143C' },
      { id: 'ig', label: 'Invictus', prob: 0.07, color: '#ECC436' },
      { id: 'fld', label: 'Field', prob: 0.09, color: '#7C5CFF' },
    ],
    media: {
      kind: 'youtube',
      src: 'C3GouGa0noM',
      poster: 'https://i.ytimg.com/vi/C3GouGa0noM/maxresdefault.jpg',
      start: 25,
    },
    tags: ['LoL', 'LPL', 'JDG', 'Knight', 'China'],
    status: 'live',
    aiConfidence: 0.39,
    aiTrend: 'up',
    trending: true,
    edgePP: 6,
  },
  {
    id: 'mkt_csl_shanghai_port',
    slug: 'shanghai-port-csl-2026',
    title: 'Shanghai Port FC wins the 2026 Chinese Super League?',
    description:
      'Resolves YES if Shanghai Port FC (上海海港) is the final league champion of the 2026 CSL season.',
    category: 'Sports',
    region: 'CN',
    endsAt: '2026-11-15T12:00:00Z',
    resolvesAt: '2026-11-20T00:00:00Z',
    volume: 211_400,
    liquidity: 51_200,
    traders: 812,
    yesProb: 0.36,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '09hVCl960jY',
      poster: 'https://i.ytimg.com/vi/09hVCl960jY/maxresdefault.jpg',
      start: 8,
    },
    tags: ['CSL', 'Football', 'Shanghai Port', 'China'],
    status: 'live',
    aiConfidence: 0.42,
    aiTrend: 'up',
    edgePP: 6,
  },
  {
    id: 'mkt_byd_beats_tesla',
    slug: 'byd-beats-tesla-ev-2026',
    title: 'BYD outsells Tesla in global BEV deliveries in FY26?',
    description:
      'Resolves YES if BYD\'s reported full-year 2026 global battery-electric-vehicle (BEV) deliveries exceed Tesla\'s global BEV deliveries, per each company\'s Q4 shareholder letter.',
    category: 'Markets',
    region: 'CN',
    endsAt: '2027-01-31T00:00:00Z',
    resolvesAt: '2027-02-07T00:00:00Z',
    volume: 1_048_200,
    liquidity: 281_400,
    traders: 4_218,
    yesProb: 0.67,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '66-eOImoiOY',
      poster: 'https://i.ytimg.com/vi/66-eOImoiOY/maxresdefault.jpg',
      start: 6,
    },
    tags: ['BYD', 'Tesla', 'EV', 'Macro'],
    status: 'live',
    aiConfidence: 0.72,
    aiTrend: 'up',
    trending: true,
    edgePP: 5,
  },
  {
    id: 'mkt_usdcny_75',
    slug: 'usd-cny-breaks-7-5',
    title: 'USD/CNY prints above 7.50 at any point in 2026?',
    description:
      'Resolves YES if the CFETS onshore USD/CNY reference rate or spot prints ≥ 7.50 on any trading day in 2026.',
    category: 'Markets',
    region: 'CN',
    endsAt: '2026-12-31T08:00:00Z',
    resolvesAt: '2027-01-05T00:00:00Z',
    volume: 722_400,
    liquidity: 184_100,
    traders: 2_411,
    yesProb: 0.29,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '2wf-lzoWPwY',
      poster: 'https://i.ytimg.com/vi/2wf-lzoWPwY/maxresdefault.jpg',
      start: 2,
    },
    tags: ['PBOC', 'USD/CNY', 'Macro', 'China'],
    status: 'live',
    aiConfidence: 0.36,
    aiTrend: 'flat',
    edgePP: 7,
  },

  // ------------------------------ JAPAN ------------------------------
  {
    id: 'mkt_chainsawman_s2',
    slug: 'chainsaw-man-s2-rating',
    title: 'Chainsaw Man S2 holds MAL score ≥ 8.5 at season end?',
    description:
      'Resolves YES if the MyAnimeList weighted score for Chainsaw Man Season 2 is ≥ 8.5 at the end of its broadcast run.',
    category: 'Film & TV',
    region: 'JP',
    endsAt: '2026-09-28T15:00:00Z',
    resolvesAt: '2026-10-05T00:00:00Z',
    volume: 914_200,
    liquidity: 242_100,
    traders: 4_482,
    yesProb: 0.44,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'dFlDRhvM4L0',
      poster: 'https://i.ytimg.com/vi/dFlDRhvM4L0/maxresdefault.jpg',
    },
    tags: ['Anime', 'MAPPA', 'Chainsaw Man', 'Japan'],
    status: 'live',
    aiConfidence: 0.38,
    aiTrend: 'up',
    trending: true,
    edgePP: 9,
    vibe: 0.78,
  },
  {
    id: 'mkt_yoasobi_oricon',
    slug: 'yoasobi-oricon-1-2026',
    title: 'YOASOBI claims a weekly #1 on the Oricon Singles Chart in 2026?',
    description:
      'Resolves YES if any YOASOBI song ranks #1 on the weekly Oricon Singles Chart at least once during the 2026 calendar year.',
    category: 'Music',
    region: 'JP',
    endsAt: '2026-12-31T15:00:00Z',
    resolvesAt: '2027-01-10T00:00:00Z',
    volume: 502_100,
    liquidity: 128_100,
    traders: 2_014,
    yesProb: 0.71,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'ZRtdQ81jPUQ',
      poster: 'https://i.ytimg.com/vi/ZRtdQ81jPUQ/maxresdefault.jpg',
      start: 20,
    },
    tags: ['J-Pop', 'YOASOBI', 'Oricon', 'Japan'],
    status: 'live',
    aiConfidence: 0.81,
    aiTrend: 'up',
    edgePP: 10,
    vibe: 0.82,
  },
  {
    id: 'mkt_hanshin_tigers_2026',
    slug: 'hanshin-tigers-japan-series-2026',
    title: 'Hanshin Tigers win the 2026 Japan Series?',
    description:
      'Resolves YES if the Hanshin Tigers are the champion of the 2026 Nippon Series.',
    category: 'Sports',
    region: 'JP',
    endsAt: '2026-10-31T13:00:00Z',
    resolvesAt: '2026-11-10T00:00:00Z',
    volume: 344_120,
    liquidity: 82_400,
    traders: 1_341,
    yesProb: 0.21,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'Af7sactG2Eo',
      poster: 'https://i.ytimg.com/vi/Af7sactG2Eo/maxresdefault.jpg',
      start: 10,
    },
    tags: ['NPB', 'Baseball', 'Hanshin', 'Japan'],
    status: 'live',
    aiConfidence: 0.25,
    aiTrend: 'flat',
    edgePP: 4,
  },
  {
    id: 'mkt_usdjpy_160',
    slug: 'usd-jpy-160-2026',
    title: 'USD/JPY closes above 160 on any day in 2026?',
    description:
      'Resolves YES if the Tokyo fix or NY close USD/JPY spot prints ≥ 160.00 on any business day during 2026.',
    category: 'Markets',
    region: 'JP',
    endsAt: '2026-12-31T21:00:00Z',
    resolvesAt: '2027-01-05T00:00:00Z',
    volume: 1_402_100,
    liquidity: 361_500,
    traders: 5_122,
    yesProb: 0.52,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '2nZt4XVxQ2k',
      poster: 'https://i.ytimg.com/vi/2nZt4XVxQ2k/maxresdefault.jpg',
      start: 2,
    },
    tags: ['USD/JPY', 'BOJ', 'Macro', 'Japan'],
    status: 'live',
    aiConfidence: 0.58,
    aiTrend: 'up',
    trending: true,
    edgePP: 6,
  },

  // --------------------- LoL PROPS (LCK · LPL · PLAYER) ---------------------
  {
    id: 'mkt_lck_spring_2026',
    slug: 'lck-spring-2026-winner',
    title: 'Who wins LCK Spring 2026?',
    description:
      'Multi-outcome market on the champion of the LCK Spring 2026 split. Resolves to the team that wins the Spring Finals.',
    category: 'Esports',
    region: 'KR',
    endsAt: '2026-04-19T12:00:00Z',
    resolvesAt: '2026-04-21T00:00:00Z',
    volume: 1_621_400,
    liquidity: 402_800,
    traders: 6_921,
    yesProb: 0.34,
    kind: 'multi',
    outcomes: [
      { id: 't1', label: 'T1', prob: 0.34, color: '#E32D2D' },
      { id: 'hle', label: 'Hanwha Life', prob: 0.24, color: '#F26B2D' },
      { id: 'gen', label: 'Gen.G', prob: 0.21, color: '#E5B838' },
      { id: 'kt', label: 'KT Rolster', prob: 0.08, color: '#ED1C24' },
      { id: 'dk', label: 'DK', prob: 0.06, color: '#1F4E9D' },
      { id: 'fld', label: 'Field', prob: 0.07, color: '#7C5CFF' },
    ],
    media: {
      kind: 'youtube',
      src: '6P3E7NGhBNg',
      poster: 'https://i.ytimg.com/vi/6P3E7NGhBNg/maxresdefault.jpg',
      start: 5,
    },
    tags: ['LoL', 'LCK', 'T1', 'Faker', 'Korea'],
    status: 'live',
    aiConfidence: 0.47,
    aiTrend: 'up',
    trending: true,
    edgePP: 9,
  },
  {
    id: 'mkt_faker_worlds_mvp',
    slug: 'faker-worlds-finals-mvp-2026',
    title: 'Faker named Worlds 2026 Finals MVP?',
    description:
      'Resolves YES if Lee Sang-hyeok (Faker) is officially awarded the Finals MVP at Worlds 2026 by Riot Games. Requires T1 to also reach the Final.',
    category: 'Esports',
    region: 'KR',
    endsAt: '2026-11-01T12:00:00Z',
    resolvesAt: '2026-11-02T00:00:00Z',
    volume: 821_200,
    liquidity: 208_400,
    traders: 3_142,
    yesProb: 0.18,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '3d7CbPj5HTw',
      poster: 'https://i.ytimg.com/vi/3d7CbPj5HTw/maxresdefault.jpg',
      start: 20,
    },
    tags: ['LoL', 'Faker', 'Worlds', 'MVP'],
    status: 'live',
    aiConfidence: 0.24,
    aiTrend: 'up',
    trending: true,
    edgePP: 6,
    vibe: 0.88,
  },
  {
    id: 'mkt_knight_kda_worlds',
    slug: 'knight-kda-5-worlds-2026',
    title: 'Knight (JDG) averages KDA ≥ 5.0 across Worlds 2026 group + knockout?',
    description:
      'Resolves YES if Knight (JDG mid-laner) records a cumulative KDA ≥ 5.00 across all official Worlds 2026 main-stage matches (Swiss + Knockouts).',
    category: 'Esports',
    region: 'CN',
    endsAt: '2026-11-01T12:00:00Z',
    resolvesAt: '2026-11-02T00:00:00Z',
    volume: 421_300,
    liquidity: 108_200,
    traders: 1_682,
    yesProb: 0.42,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '1Z6CHioIn3s',
      poster: 'https://i.ytimg.com/vi/1Z6CHioIn3s/maxresdefault.jpg',
      start: 15,
    },
    tags: ['LoL', 'Knight', 'JDG', 'LPL', 'Player Prop'],
    status: 'live',
    aiConfidence: 0.49,
    aiTrend: 'flat',
    edgePP: 7,
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
      kind: 'youtube',
      src: '5ZSEDfslRxk',
      poster: 'https://i.ytimg.com/vi/5ZSEDfslRxk/maxresdefault.jpg',
      start: 2,
    },
    tags: ['Korea', 'Election', 'Politics', '2027'],
    status: 'live',
    aiConfidence: 0.53,
    aiTrend: 'flat',
    edgePP: 7,
  },

  // --------------------- v2.21 — APAC EXPANSION ----------------------
  //
  // Added 10 markets to tell the full "APAC-native, not K-only" story
  // at a glance for a VC-deck demo. Coverage map:
  //   - India    (Bollywood, IPL)
  //   - Japan    (YOASOBI, Demon Slayer, NPB, BOJ)
  //   - China    (JDG at Worlds)
  //   - SEA      (MLBB M-series)
  //   - Korea    (IVE, Upbit)
  //
  // Video IDs reuse known-public public YouTube MVs / trailers; posters
  // fall back through the v2.16 chain if a specific ID has been pulled.
  //
  // -------------------------------- INDIA ---------------------------

  {
    id: 'mkt_pathaan_2_box_office',
    slug: 'pathaan-2-opening-week-500cr',
    title: "Shah Rukh Khan's Pathaan sequel crosses ₹500cr opening week?",
    description:
      'Resolves YES if the opening-week (7 days from theatrical release) net box office for Pathaan 2 (dir. Siddharth Anand) crosses ₹500 crore across India + overseas combined, per Box Office India + Koimoi tracking.',
    category: 'Film & TV',
    region: 'SEA',
    endsAt: '2026-09-15T18:30:00Z',
    resolvesAt: '2026-09-22T00:00:00Z',
    volume: 612_800,
    liquidity: 172_100,
    traders: 2_141,
    yesProb: 0.58,
    kind: 'binary',
    // v2.22-4: Video ID audit. Pathaan-specific trailer IDs are not
    // reliably available via oEmbed; we fall back to a stable,
    // well-known SRK/Bollywood public MV (same visual vibe — dance,
    // cinema energy) so the card always plays. When licensed
    // Pathaan 2 assets land, swap in the real trailer.
    media: {
      kind: 'youtube',
      src: '66-eOImoiOY',
      poster: 'https://i.ytimg.com/vi/66-eOImoiOY/maxresdefault.jpg',
    },
    tags: ['Bollywood', 'SRK', 'India', 'Box Office'],
    status: 'live',
    aiConfidence: 0.66,
    aiTrend: 'up',
    trending: true,
    edgePP: 8,
    vibe: 0.71,
  },
  {
    id: 'mkt_ipl_opener_beats_sb',
    slug: 'ipl-2026-opener-beats-super-bowl',
    title: 'IPL 2026 opener beats Super Bowl LX on same-day streaming viewers?',
    description:
      'Resolves YES if JioCinema + Hotstar combined live concurrent viewership for IPL 2026 opener (expected late-March) exceeds NBC + Peacock peak concurrent for Super Bowl LX (Feb 8, 2026).',
    category: 'Sports',
    region: 'SEA',
    endsAt: '2026-03-28T15:00:00Z',
    resolvesAt: '2026-04-03T00:00:00Z',
    volume: 1_080_400,
    liquidity: 281_200,
    traders: 3_902,
    yesProb: 0.71,
    kind: 'binary',
    // v2.22-4: IPL-specific clip IDs flicker; reuse the sports-crowd
    // Worlds clip for reliable playback. Cricket match footage is a
    // licensing hassle in general — production will pull from the
    // BCCI / JioCinema feed once partnerships land.
    media: {
      kind: 'youtube',
      src: 'AOTfM6H8XOo',
      poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
      start: 12,
    },
    tags: ['Cricket', 'IPL', 'India', 'Streaming'],
    status: 'live',
    aiConfidence: 0.79,
    aiTrend: 'up',
    trending: true,
    edgePP: 8,
  },

  // -------------------------------- JAPAN ---------------------------

  {
    id: 'mkt_yoasobi_billboard',
    slug: 'yoasobi-billboard-hot-100-top-40',
    title: 'YOASOBI charts Billboard Hot 100 top 40 in 2026?',
    description:
      'Resolves YES if any YOASOBI single (new or catalog) charts in the weekly Billboard Hot 100 top 40 at any point during calendar 2026. Digital + streaming aggregate, per official Billboard chart.',
    category: 'Music',
    region: 'JP',
    endsAt: '2026-12-31T07:00:00Z',
    resolvesAt: '2027-01-10T00:00:00Z',
    volume: 524_900,
    liquidity: 142_800,
    traders: 1_812,
    yesProb: 0.34,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'ZRtdQ81jPUQ',
      poster: 'https://i.ytimg.com/vi/ZRtdQ81jPUQ/maxresdefault.jpg',
    },
    tags: ['J-Pop', 'YOASOBI', 'Japan', 'Billboard'],
    status: 'live',
    aiConfidence: 0.42,
    aiTrend: 'up',
    edgePP: 8,
    vibe: 0.62,
    trending: true,
  },
  {
    id: 'mkt_demon_slayer_p3_2026',
    slug: 'demon-slayer-infinity-castle-p3-2026',
    title: 'Demon Slayer: Infinity Castle Part 3 releases before end of 2026?',
    description:
      'Resolves YES if ufotable / Aniplex announces AND theatrically releases the final Part 3 of the Infinity Castle trilogy in any market before Dec 31, 2026 11:59PM JST.',
    category: 'Film & TV',
    region: 'JP',
    endsAt: '2026-12-31T14:59:00Z',
    resolvesAt: '2027-01-05T00:00:00Z',
    volume: 826_100,
    liquidity: 218_400,
    traders: 3_218,
    yesProb: 0.27,
    kind: 'binary',
    // v2.22-4: Reuse the Chainsaw Man MAPPA clip (already verified in
    // production since v2.3) — same anime studio aesthetic, both
    // card types land in the same "dark anime action" visual lane.
    media: {
      kind: 'youtube',
      src: 'dFlDRhvM4L0',
      poster: 'https://i.ytimg.com/vi/dFlDRhvM4L0/maxresdefault.jpg',
    },
    tags: ['Anime', 'Demon Slayer', 'ufotable', 'Aniplex'],
    status: 'live',
    aiConfidence: 0.35,
    aiTrend: 'flat',
    edgePP: 8,
    vibe: 0.68,
  },
  {
    id: 'mkt_yakult_japan_series_26',
    slug: 'yakult-swallows-japan-series-2026',
    title: 'Yakult Swallows win the 2026 Japan Series?',
    description:
      'Resolves YES if the Tokyo Yakult Swallows lift the Japan Series championship trophy at the conclusion of the 2026 NPB postseason. Best of 7 format, CL champion vs PL champion.',
    category: 'Sports',
    region: 'JP',
    endsAt: '2026-11-05T12:00:00Z',
    resolvesAt: '2026-11-10T00:00:00Z',
    volume: 372_500,
    liquidity: 102_300,
    traders: 1_228,
    yesProb: 0.12,
    kind: 'binary',
    // v2.22-4: NPB highlight IDs are region-locked outside Japan for
    // most users; reuse the neutral Worlds sports-crowd clip for
    // reliable playback in demo regions.
    media: {
      kind: 'youtube',
      src: 'AOTfM6H8XOo',
      poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
      start: 28,
    },
    tags: ['NPB', 'Yakult', 'Japan', 'Baseball'],
    status: 'live',
    aiConfidence: 0.18,
    aiTrend: 'flat',
    edgePP: 6,
  },
  {
    id: 'mkt_boj_rate_cut_q3',
    slug: 'boj-first-rate-cut-by-q3-2026',
    title: 'BOJ delivers its first rate cut (since 2016) by end of Q3 2026?',
    description:
      "Resolves YES if the Bank of Japan's Policy Board announces a cut to the uncollateralized overnight call rate (or equivalent policy rate) at any meeting on or before Sep 30, 2026. Hikes do not resolve the market.",
    category: 'Markets',
    region: 'JP',
    endsAt: '2026-09-30T03:00:00Z',
    resolvesAt: '2026-10-07T00:00:00Z',
    volume: 1_312_700,
    liquidity: 341_900,
    traders: 4_281,
    yesProb: 0.23,
    kind: 'binary',
    // v2.22-4: BOJ policy-meeting clips get pulled quickly; reuse the
    // PBOC/CNY macro feed video for stable playback. Both are FX /
    // monetary policy adjacent so the vibe matches.
    media: {
      kind: 'youtube',
      src: '2wf-lzoWPwY',
      poster: 'https://i.ytimg.com/vi/2wf-lzoWPwY/maxresdefault.jpg',
    },
    tags: ['BOJ', 'Japan', 'Macro', 'Rates'],
    status: 'live',
    aiConfidence: 0.17,
    aiTrend: 'down',
    edgePP: 6,
  },

  // -------------------------------- CHINA ---------------------------

  {
    id: 'mkt_jdg_worlds_final_2026',
    slug: 'jdg-reaches-worlds-2026-final',
    title: 'JDG reaches the 2026 LoL Worlds Finals?',
    description:
      'Resolves YES if JD Gaming advances to (wins semifinals at) the 2026 League of Legends World Championship Finals stage, regardless of final result.',
    category: 'Esports',
    region: 'CN',
    endsAt: '2026-11-01T12:00:00Z',
    resolvesAt: '2026-11-10T00:00:00Z',
    volume: 918_400,
    liquidity: 241_800,
    traders: 3_841,
    yesProb: 0.39,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'AOTfM6H8XOo',
      poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
      start: 15,
    },
    tags: ['LoL', 'LPL', 'JDG', 'Knight', 'Worlds'],
    status: 'live',
    aiConfidence: 0.45,
    aiTrend: 'up',
    trending: true,
    edgePP: 6,
  },

  // --------------------------------- SEA ----------------------------

  {
    id: 'mkt_mlbb_m6_record',
    slug: 'mlbb-m6-jakarta-viewer-record',
    title: 'MLBB M6 Jakarta breaks peak concurrent viewer record?',
    description:
      'Resolves YES if MOONTON reports peak concurrent viewers for the M6 World Championship (hosted in Jakarta) exceeds the current MLBB World Championship record set at M5.',
    category: 'Esports',
    region: 'SEA',
    endsAt: '2026-12-15T12:00:00Z',
    resolvesAt: '2026-12-22T00:00:00Z',
    volume: 288_100,
    liquidity: 78_400,
    traders: 1_041,
    yesProb: 0.63,
    kind: 'binary',
    // v2.22-4: MLBB tournament-trailer IDs are less predictable; reuse
    // the neutral Worlds/LCK esports-crowd clip for reliable playback.
    media: {
      kind: 'youtube',
      src: 'AOTfM6H8XOo',
      poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
      start: 5,
    },
    tags: ['MLBB', 'MOONTON', 'Indonesia', 'SEA Esports'],
    status: 'live',
    aiConfidence: 0.72,
    aiTrend: 'up',
    trending: true,
    edgePP: 9,
  },

  // -------------------------------- KOREA ---------------------------

  {
    id: 'mkt_ive_mama_daesang_2026',
    slug: 'ive-mama-daesang-2026',
    title: 'IVE wins Artist of the Year (Daesang) at MAMA 2026?',
    description:
      "Resolves YES if IVE is announced as the Daesang winner of the 'Artist of the Year' category at the 2026 MAMA Awards ceremony. Only the top-line Daesang counts — genre Bonsang awards do not resolve YES.",
    category: 'Music',
    region: 'KR',
    endsAt: '2026-11-28T12:00:00Z',
    resolvesAt: '2026-12-02T00:00:00Z',
    volume: 491_200,
    liquidity: 127_300,
    traders: 2_008,
    yesProb: 0.31,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: 'V37TaRdVUQY',
      poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
    },
    tags: ['K-Pop', 'IVE', 'MAMA', 'Daesang', 'Starship'],
    status: 'live',
    aiConfidence: 0.38,
    aiTrend: 'up',
    edgePP: 7,
    vibe: 0.66,
    trending: true,
  },
  {
    id: 'mkt_upbit_vs_binance_2026',
    slug: 'upbit-volume-share-over-20pct',
    title: 'Upbit captures >20% of global spot crypto volume on any Q2 day?',
    description:
      "Resolves YES if Upbit's reported daily spot volume (CoinGecko + Kaiko blended) exceeds 20% of global spot crypto exchange volume on any trading day in Q2 2026. Kimchi-premium weeks historically spike to ~15%.",
    category: 'Crypto',
    region: 'KR',
    endsAt: '2026-06-30T14:59:00Z',
    resolvesAt: '2026-07-07T00:00:00Z',
    volume: 742_300,
    liquidity: 198_400,
    traders: 2_581,
    yesProb: 0.28,
    kind: 'binary',
    media: {
      kind: 'youtube',
      src: '2wf-lzoWPwY',
      poster: 'https://i.ytimg.com/vi/2wf-lzoWPwY/maxresdefault.jpg',
      start: 4,
    },
    tags: ['Crypto', 'Upbit', 'Korea', 'Binance'],
    status: 'live',
    aiConfidence: 0.34,
    aiTrend: 'up',
    edgePP: 6,
  },
];

export function getMarket(idOrSlug: string): Market | undefined {
  return MARKETS.find((m) => m.id === idOrSlug || m.slug === idOrSlug);
}

export function getAITrader(handle: string): AITrader | undefined {
  return AI_TRADERS.find((t) => t.handle === handle || t.id === handle);
}

export const TRENDING_MARKETS: Market[] = MARKETS.filter(
  (m) => m.trending && m.status !== 'resolved'
);

/** Markets that are still tradable (i.e. not resolved). */
export const LIVE_MARKETS: Market[] = MARKETS.filter((m) => m.status !== 'resolved');

/** Markets that have already settled. */
export const RESOLVED_MARKETS: Market[] = MARKETS.filter((m) => m.status === 'resolved');

/*
 * v2.23-4 — MECE label set. See the comment on `MarketCategory` in
 * lib/types.ts for the rationale. Order here drives the chip row on
 * the landing page, chosen by live-catalog volume: Esports (8) and
 * Music (8) lead, then Sports (6), Film & TV (7), Markets (5),
 * Crypto (2), Politics (1) trail.
 */
export const CATEGORIES: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Music', value: 'Music' },
  { label: 'Film & TV', value: 'Film & TV' },
  { label: 'Esports', value: 'Esports' },
  { label: 'Sports', value: 'Sports' },
  { label: 'Crypto', value: 'Crypto' },
  { label: 'Markets', value: 'Markets' },
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
  { id: 'u_11', handle: 'shanghai.dragon', avatar: '🐉', region: 'APAC', pnl30d: 41_200, winRate: 0.62, volume30d: 388_200, streak: 4, badge: 'culture' },
  { id: 'u_12', handle: 'osaka.tiger', avatar: '🐯', region: 'JP', pnl30d: 33_800, winRate: 0.58, volume30d: 282_400, streak: 3 },
  { id: 'u_13', handle: 'mappa.maxi', avatar: '🎴', region: 'JP', pnl30d: 26_600, winRate: 0.64, volume30d: 184_200, streak: 5, badge: 'culture' },
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
  {
    id: 'ai_06',
    handle: 'lpl.scout',
    avatar: '🐉',
    model: 'Allora-KR',
    strategy: 'LPL draft-state + patch-meta quant · Weibo Esports + HupuBBS sentiment',
    pnl30d: 38_400,
    winRate: 0.66,
    aum: 144_800,
    followers: 512,
    region: 'APAC',
    live: true,
  },
  {
    id: 'ai_07',
    handle: 'anime.signal.jp',
    avatar: '🎴',
    model: 'Qwen3-32B',
    strategy: 'MAL weighted-score + Anilist + 2ch episode-thread heat → seasonal anime alpha',
    pnl30d: 28_900,
    winRate: 0.63,
    aum: 98_400,
    followers: 344,
    region: 'JP',
    live: true,
  },
  {
    id: 'ai_08',
    handle: 'npb.analytics',
    avatar: '🐯',
    model: 'Conviction-v2',
    strategy: 'NPB / KBO / CSL quant · pitching tendency + park factor + Sabermetrics',
    pnl30d: 19_200,
    winRate: 0.60,
    aum: 72_100,
    followers: 182,
    region: 'JP',
    live: true,
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
      src: '3Hb61Cs0zFY',
      poster: 'https://i.ytimg.com/vi/3Hb61Cs0zFY/maxresdefault.jpg',
      start: 5,
    },
  },
  {
    id: 'nx_lpl_rising',
    slug: 'lpl-rising-2026',
    // v2.23-2: Dropped the Korean tail `· 중국 리그 제국` — everywhere
    // else in the landing reads English-only, and the mixed-script chip
    // in NarrativeIndices was the only Korean leaking through. Title is
    // now parallel with the other four narratives.
    title: 'LPL Rising',
    blurb: 'JDG · BLG · Knight — can the LPL reclaim Worlds and dominate patch 2026?',
    emoji: '🐉',
    legs: [
      { marketId: 'mkt_lpl_spring_2026', weight: 0.55 },
      { marketId: 'mkt_knight_kda_worlds', weight: 0.25 },
      { marketId: 'mkt_worlds_winner_2026', weight: 0.2 },
    ],
    price: 0.41,
    change24h: 1.9,
    media: {
      kind: 'youtube',
      src: '4Twd965VzX4',
      poster: 'https://i.ytimg.com/vi/4Twd965VzX4/maxresdefault.jpg',
      start: 8,
    },
  },
  {
    id: 'nx_japan_heat',
    slug: 'japan-heat-2026',
    title: 'Japan Heat Index',
    blurb: 'Anime · J-Pop · NPB · USD/JPY — a single basket on the Japanese cultural rally.',
    emoji: '🗼',
    legs: [
      { marketId: 'mkt_chainsawman_s2', weight: 0.3 },
      { marketId: 'mkt_yoasobi_oricon', weight: 0.25 },
      { marketId: 'mkt_hanshin_tigers_2026', weight: 0.15 },
      { marketId: 'mkt_usdjpy_160', weight: 0.15 },
      { marketId: 'mkt_nikkei_50k', weight: 0.15 },
    ],
    price: 0.54,
    change24h: 2.1,
    media: {
      kind: 'youtube',
      src: 'ZRtdQ81jPUQ',
      poster: 'https://i.ytimg.com/vi/ZRtdQ81jPUQ/maxresdefault.jpg',
      start: 12,
    },
  },
  {
    id: 'nx_china_macro',
    slug: 'china-macro-2026',
    title: 'China Macro · FY26',
    blurb: 'BYD · USD/CNY · CSL · Jay Chou — Greater China pricing, from soft power to hard assets.',
    emoji: '🐲',
    legs: [
      { marketId: 'mkt_byd_beats_tesla', weight: 0.35 },
      { marketId: 'mkt_usdcny_75', weight: 0.25 },
      { marketId: 'mkt_jaychou_album_2026', weight: 0.2 },
      { marketId: 'mkt_csl_shanghai_port', weight: 0.1 },
      { marketId: 'mkt_cdrama_joyofreign', weight: 0.1 },
    ],
    price: 0.47,
    change24h: -0.8,
    media: {
      kind: 'youtube',
      src: '0oxqSkJlNzg',
      poster: 'https://i.ytimg.com/vi/0oxqSkJlNzg/maxresdefault.jpg',
      start: 3,
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
      kind: 'youtube',
      src: 'AA-sv3ilNBE',
      poster: 'https://i.ytimg.com/vi/AA-sv3ilNBE/maxresdefault.jpg',
      start: 3,
    },
  },
];

// --------- K-Culture Debut Calendar ----------

/**
 * v2.22-3 — APAC-wide debut radar.
 *
 * Through v2.21 this list was K-pop only (HYBE / SM / YG / JYP / ADOR)
 * and the component was branded "K-Culture Debut Calendar". For a
 * Tier-1 VC demo that leaned too K-centric; we now cover the full
 * APAC surface with a mix of music, anime, drama, film, and esports
 * drops. Kept the heat + poster + (optional) linked market shape
 * identical so the UI stays drop-in compatible.
 */
/*
 * v2.23-3 — Interleaved Spawn-vs-linked order.
 *
 * Through v2.22-3 the calendar strip was ordered by region block
 * (Korea → Japan → China → India → SEA). The two "Spawn market"
 * CTAs (events without a `marketId`, iQiyi + Dharma) ended up buried
 * in positions 7 and 9. Users skimming the first three cards never
 * saw the permissionless-creation story.
 *
 * New order: every third card is a Spawn CTA (2:1 linked-to-spawn
 * ratio). That pulls the "you can propose the next market yourself"
 * message into the reader's first scroll-horizontal and reinforces
 * Conviction's core differentiator. Four Spawn cards now (two were
 * already here; added Squid Game S3 and SMTown Live concert so the
 * 2:1 rhythm holds across all 12 cards instead of running out of
 * spawn slots mid-strip).
 *
 * Chronological order inside each run is preserved loosely — we
 * still lead with the highest-heat near-term events (BLACKPINK,
 * Demon Slayer) so the strip reads hot → cool horizontally.
 */
export const DEBUT_EVENTS: DebutEvent[] = [
  // Pair 1 → Spawn
  {
    id: 'db_01',
    artist: 'BLACKPINK',
    title: 'BLACKPINK full-group comeback',
    marketId: 'mkt_blackpink_2026',
    company: 'YG',
    region: 'KR',
    dropsAt: '2026-06-21T00:00:00Z',
    heat: 0.91,
    poster: 'https://i.ytimg.com/vi/ioNng23DkIM/maxresdefault.jpg',
  },
  {
    id: 'db_02',
    artist: 'ufotable',
    title: 'Demon Slayer: Infinity Castle · Part 3 premiere',
    marketId: 'mkt_demon_slayer_p3_2026',
    company: 'ufotable',
    region: 'JP',
    dropsAt: '2026-09-15T00:00:00Z',
    heat: 0.88,
    // v2.22-4: Use Chainsaw Man poster (MAPPA, stable) as a safer
    // anime-action visual until a verified Demon Slayer thumbnail
    // lands in the asset pipeline.
    poster: 'https://i.ytimg.com/vi/dFlDRhvM4L0/maxresdefault.jpg',
  },
  {
    // v2.23-3 — First Spawn slot (new). Netflix hasn't confirmed a
    // Squid Game S3 premiere window yet, so no linked market exists —
    // perfect fit for the AI wizard CTA ("spawn this market in 45s").
    id: 'db_03',
    artist: 'Netflix',
    title: 'Squid Game · S3 global premiere',
    company: 'Other',
    region: 'KR',
    dropsAt: '2026-10-12T00:00:00Z',
    heat: 0.87,
    poster: 'https://i.ytimg.com/vi/oqxAJKy0ii4/maxresdefault.jpg',
  },

  // Pair 2 → Spawn
  {
    id: 'db_04',
    artist: 'IVE',
    title: 'IVE · MAMA Daesang campaign',
    marketId: 'mkt_ive_mama_daesang_2026',
    company: 'HYBE',
    region: 'KR',
    dropsAt: '2026-11-28T12:00:00Z',
    heat: 0.78,
    poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
  },
  {
    id: 'db_05',
    artist: 'JDG',
    title: 'JDG · 2026 Worlds roster announcement',
    marketId: 'mkt_jdg_worlds_final_2026',
    company: 'JDG',
    region: 'CN',
    dropsAt: '2026-05-08T04:00:00Z',
    heat: 0.76,
    poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
  },
  {
    id: 'db_06',
    artist: 'Dharma Productions',
    title: 'Dharma · FY26 slate reveal',
    company: 'Dharma',
    region: 'IN',
    dropsAt: '2026-05-28T10:00:00Z',
    heat: 0.58,
    poster: 'https://i.ytimg.com/vi/66-eOImoiOY/maxresdefault.jpg',
  },

  // Pair 3 → Spawn
  {
    id: 'db_07',
    artist: 'YOASOBI',
    title: 'YOASOBI · first global arena tour',
    marketId: 'mkt_yoasobi_billboard',
    company: 'Sony Music JP',
    region: 'JP',
    dropsAt: '2026-07-18T10:00:00Z',
    heat: 0.72,
    poster: 'https://i.ytimg.com/vi/ZRtdQ81jPUQ/maxresdefault.jpg',
  },
  {
    id: 'db_08',
    artist: 'YRF · SRK',
    title: 'Pathaan 2 · theatrical opening',
    marketId: 'mkt_pathaan_2_box_office',
    company: 'YRF',
    region: 'IN',
    dropsAt: '2026-09-10T00:00:00Z',
    heat: 0.85,
    // v2.22-4: Reuse the verified SRK/Bollywood MV poster so both the
    // calendar card and the market card pull from the same reliable
    // video asset.
    poster: 'https://i.ytimg.com/vi/66-eOImoiOY/maxresdefault.jpg',
  },
  {
    id: 'db_09',
    artist: 'iQiyi',
    title: 'Joy of Reign · Season 2 launch',
    company: 'iQiyi',
    region: 'CN',
    dropsAt: '2026-08-22T12:00:00Z',
    heat: 0.62,
    poster: 'https://i.ytimg.com/vi/2wf-lzoWPwY/maxresdefault.jpg',
  },

  // Pair 4 → Spawn
  {
    id: 'db_10',
    artist: 'MAPPA',
    title: 'Chainsaw Man S2 · final arc key art',
    marketId: 'mkt_chainsawman_s2',
    company: 'MAPPA',
    region: 'JP',
    dropsAt: '2026-06-01T00:00:00Z',
    heat: 0.69,
    poster: 'https://i.ytimg.com/vi/dFlDRhvM4L0/maxresdefault.jpg',
  },
  {
    id: 'db_11',
    artist: 'MOONTON · MLBB M6',
    title: 'MLBB M6 World Championship · Jakarta',
    marketId: 'mkt_mlbb_m6_record',
    company: 'MOONTON',
    region: 'SEA',
    dropsAt: '2026-12-05T07:00:00Z',
    heat: 0.73,
    // v2.22-4: Reuse verified Worlds esports poster — both are
    // competitive-gaming finals, same visual lane.
    poster: 'https://i.ytimg.com/vi/AOTfM6H8XOo/maxresdefault.jpg',
  },
  {
    // v2.23-3 — Last Spawn slot (new). SM Town Live Tokyo Dome is
    // the biggest JP-side K-pop concert of the year but no
    // "will they sell out all 4 nights?" market exists yet — prime
    // Spawn example for the strip's trailing position.
    id: 'db_12',
    artist: 'SM Town',
    title: 'SMTown Live · Tokyo Dome · 4-night sellout',
    company: 'SM',
    region: 'JP',
    dropsAt: '2026-08-02T10:00:00Z',
    heat: 0.64,
    poster: 'https://i.ytimg.com/vi/V37TaRdVUQY/maxresdefault.jpg',
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
