'use client';
/**
 * Lightweight i18n — no next-intl dependency, no JSON fetch.
 * EN default, KO toggle. Stored in cookie via ClientProvider.
 *
 * Usage:
 *   const t = useT();
 *   t('hero.tagline')
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Locale = 'en' | 'ko';

type Dict = Record<string, string>;

const EN: Dict = {
  'nav.markets': 'Markets',
  'nav.feed': 'Feed',
  'nav.new': 'New',
  'nav.leaderboard': 'Leaderboard',
  'nav.portfolio': 'Portfolio',
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
  'parlay.place_another': 'Build another',

  'portfolio.tickets': 'Parlay tickets',
  'portfolio.no_tickets': 'No parlay tickets yet. Build one from the slip.',
  'portfolio.ticket_open': 'Open',
  'portfolio.ticket_won': 'Won',
  'portfolio.ticket_lost': 'Lost',
  'portfolio.ticket_placed': 'Placed',
  'portfolio.ticket_to_win': 'To win',

  'onb.skip': 'Skip',
  'onb.next': 'Next',
  'onb.start': 'Start trading',
  'onb.1.title': 'Trade every Asia narrative',
  'onb.1.body':
    'K-pop, K-drama, LCK, KBO, BTC, elections — every Asia thesis is a market priced in ¢.',
  'onb.2.title': 'AI-graded evidence',
  'onb.2.body':
    'Qwen3 drafts, Sonnet-4.6 verifies. 23 scrapers keep every market honest — inspect the evidence bundle on any card.',
  'onb.3.title': 'Swipe, stack, conviction',
  'onb.3.body':
    'TikTok-style feed. Tap + to stack picks into a parlay, copy-trade agentic quants, ride the Hallyu wave on-chain.',

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

  'lang.toggle': 'KO',
  'lang.toggle_en': 'EN',
};

const KO: Dict = {
  'nav.markets': '마켓',
  'nav.feed': '피드',
  'nav.new': '마켓 제안',
  'nav.leaderboard': '리더보드',
  'nav.portfolio': '포트폴리오',
  'nav.connect': '지갑 연결',
  'nav.live': '라이브',
  'nav.search': '마켓, 트레이더, 태그 검색…',

  'hero.tagline': '아시아 모든 내러티브에 대한 확신을 거래하세요.',
  'hero.sub':
    'K팝 · K드라마 · LCK · KBO · BTC · 선거 — AI가 가격을 매기고, 증거로 증명하며, APAC 온체인에서 결제됩니다.',
  'hero.cta_trade': '지금 거래',
  'hero.cta_how': '작동 방식',

  'hp.how_h': 'AI가 가격을 매기고,',
  'hp.how_h2': '증거로 증명합니다.',
  'hp.step_1_t': '제안',
  'hp.step_1_d':
    '누구나 마켓을 제안할 수 있어요. Intent Parser가 KBO · K-Pop · LCK · 매크로 도메인 스택으로 자동 라우팅합니다.',
  'hp.step_2_t': '스웜',
  'hp.step_2_d':
    'Brave · Exa · CoinGecko · TheSportsDB 등 23개 스크래퍼가 병렬로 수집 + ChromaDB 기반 도메인 RAG.',
  'hp.step_3_t': '결제',
  'hp.step_3_d':
    'Qwen3-32B가 판정, Claude Sonnet이 검증. 신뢰도 0.8 이상이면 자동 결제, 아니면 휴먼 오라클.',
  'hp.all_markets': '전체 마켓',

  'card.yes': 'YES',
  'card.trending': '트렌딩',
  'card.edge': '엣지',
  'card.vol': '거래량',
  'card.traders': '트레이더',

  'feed.title': '컨빅션 피드',
  'feed.sub': '내러티브를 스와이프하고, 확신으로 베팅하세요.',
  'feed.add_parlay': '파레이에 추가',
  'feed.add_parlay_short': '+ 파레이',
  'feed.long_swipe': '위로 스와이프 ↑',

  'parlay.title': '파레이 슬립',
  'parlay.empty': '마켓을 추가해 파레이를 만들어보세요. 배당이 누적됩니다.',
  'parlay.legs': '레그',
  'parlay.stake': '스테이크',
  'parlay.mult': '합산 배당',
  'parlay.payout': '최대 수익',
  'parlay.place': '파레이 제출',
  'parlay.clear': '비우기',
  'parlay.placing': '서명 후 브로드캐스트 중…',
  'parlay.placed': '온체인 제출 완료',
  'parlay.tx': '트랜잭션',
  'parlay.block': '블록',
  'parlay.view_portfolio': '포트폴리오에서 보기 →',
  'parlay.place_another': '또 만들기',

  'portfolio.tickets': '파레이 티켓',
  'portfolio.no_tickets': '아직 파레이 티켓이 없어요. 슬립에서 하나 만들어보세요.',
  'portfolio.ticket_open': '진행중',
  'portfolio.ticket_won': '승리',
  'portfolio.ticket_lost': '패배',
  'portfolio.ticket_placed': '제출',
  'portfolio.ticket_to_win': '잠재 수익',

  'onb.skip': '건너뛰기',
  'onb.next': '다음',
  'onb.start': '거래 시작',
  'onb.1.title': '아시아의 모든 내러티브, 하나의 시장',
  'onb.1.body':
    'K팝, K드라마, LCK, KBO, BTC, 선거 — 모든 아시아의 테제가 ¢ 단위로 가격이 매겨집니다.',
  'onb.2.title': 'AI가 증거로 판정',
  'onb.2.body':
    'Qwen3가 초안, Sonnet-4.6가 검증. 23개 스크래퍼가 실시간으로 증거를 수집 — 모든 카드에서 번들을 열어볼 수 있어요.',
  'onb.3.title': '스와이프하고, 쌓고, 확신',
  'onb.3.body':
    '틱톡 스타일 피드. + 버튼으로 파레이에 쌓고, 에이전틱 퀀트를 카피-트레이드하며, 한류 파도를 온체인에서 타세요.',

  'mobnav.markets': '마켓',
  'mobnav.feed': '피드',
  'mobnav.propose': '제안',
  'mobnav.portfolio': '포트폴리오',
  'mobnav.leaderboard': '랭킹',

  'trader.copy': '카피-트레이드',
  'trader.copying': '카피 중',
  'trader.followers': '팔로워',
  'trader.winrate': '승률',
  'trader.pnl30': '30일 PnL',
  'trader.aum': '운용자산',
  'trader.strategy': '전략',
  'trader.recent': '최근 픽',
  'trader.pnl_chart': '30일 PnL 커브',

  'ai.title': '컨빅션 오라클',
  'ai.subtitle': 'Qwen3 · Sonnet-4.6 · 23개 스크래퍼',
  'ai.inspect': '증거 번들 열기',
  'ai.confidence': '신뢰도',
  'ai.vs_market': '시장 대비',

  'evidence.title': '증거 번들',
  'evidence.verdict': '판정',
  'evidence.judged': '판정 모델',
  'evidence.reasoning': '추론 근거',
  'evidence.sources': '출처',
  'evidence.retrieved': '수집 시점',
  'evidence.close': '닫기',

  'newmkt.title': '마켓 제안하기',
  'newmkt.sub': '질문만 입력하세요. 에이전트가 알아서 합니다.',
  'newmkt.placeholder': '예: "BLACKPINK이 2026 Q4에 Spotify 글로벌 1위를 차지할까?"',
  'newmkt.propose': '컨빅션 스웜 실행',
  'newmkt.step.parse': '의도 파싱',
  'newmkt.step.route': '도메인 스택 라우팅',
  'newmkt.step.scrape': '23개 스크래퍼 병렬 수집',
  'newmkt.step.judge': 'Qwen3가 판정 초안 작성',
  'newmkt.step.verify': 'Sonnet-4.6가 검증',
  'newmkt.step.publish': '마켓 게시',
  'newmkt.done': '마켓 초안 준비 완료',

  'agentic.title': '에이전틱 트레이더 · 라이브',
  'agentic.sub': '온체인에서 자율 거래하는 AI 퀀트 · 카피트레이드 가능.',
  'agentic.follow': '팔로우',
  'agentic.aum': '운용자산',

  'narrative.title': '내러티브 인덱스',
  'narrative.sub': '문화 테마를 한 번에 거래하세요.',
  'narrative.suite': '컨빅션 인덱스 스위트',
  'narrative.trade': '거래',

  'nx.live_pill': '내러티브 인덱스 · 라이브',
  'nx.index_price': '인덱스 가격',
  'nx.24h': '24시간',
  'nx.basket_vol': '바스켓 거래량',
  'nx.liquidity': '유동성',
  'nx.trade_btn': '인덱스 거래',
  'nx.spawn_variant': '변형 생성',
  'nx.basket_constituents': '바스켓 구성',
  'nx.weighted_markets_suffix': '개 가중 마켓',
  'nx.total_weight': '총 가중치',
  'nx.leg_suffix': '레그',
  'nx.conviction_h': '이 테제에 대한 확신',
  'nx.traders_riding': '타고 있는 트레이더',
  'nx.agentic_quants': '에이전틱 퀀트',
  'nx.human_conviction': '휴먼 확신',
  'nx.aum_short': '운용자산',
  'nx.win_short': '승률',
  'nx.live_short': '라이브',

  'col.market': '마켓',
  'col.side': '사이드',
  'col.trader': '트레이더',
  'col.region': '지역',
  'col.badge': '배지',
  'col.price': '가격',
  'col.qty': '수량',
  'col.entry': '진입가',
  'col.pnl': '손익',

  'debut.title': 'K-컬처 데뷔 캘린더',
  'debut.sub': '예정된 컴백 · 모든 이벤트가 라이브 마켓으로 생성됩니다.',
  'debut.create_market': '마켓 만들기',
  'debut.view_market': '마켓 보기',

  'vibe.title': 'Vibe 체크',
  'vibe.sub': '문화 감성 지표 · 24시간 · Weverse + X + Instiz + Reddit',

  'mute.muted': '음소거',
  'mute.unmuted': '사운드 켜짐',

  'lang.toggle': 'EN',
  'lang.toggle_en': 'KO',
};

const DICTS: Record<Locale, Dict> = { en: EN, ko: KO };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => DICTS.en[k] ?? k,
});

export function useI18n() {
  return useContext(Ctx);
}

export function useT() {
  return useContext(Ctx).t;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = typeof document !== 'undefined'
      ? document.cookie
          .split('; ')
          .find((c) => c.startsWith('cv_lang='))
          ?.split('=')[1]
      : null;
    if (stored === 'ko' || stored === 'en') setLocaleState(stored);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof document !== 'undefined') {
      document.cookie = `cv_lang=${l}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }
  }, []);

  const t = useCallback(
    (k: string) => DICTS[locale][k] ?? DICTS.en[k] ?? k,
    [locale]
  );

  return (
    <Ctx.Provider value={{ locale, setLocale, t }}>
      {/* children rendered untouched — component tree just reads context */}
      {children}
    </Ctx.Provider>
  );
}
