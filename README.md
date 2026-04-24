# Conviction — APAC-native Prediction Market

> **The first APAC-native, AI-powered permissionless prediction market.**
> K-pop comebacks, LCK vs LPL, NPB, Bollywood openings, anime ratings,
> APAC macro — every narrative that moves 4 billion people, priced live,
> resolved by a 23-source AI Oracle swarm.

**Live:** [conviction-fe.vercel.app](https://conviction-fe.vercel.app) ·
**Pitch:** [conviction-fe.vercel.app/investors](https://conviction-fe.vercel.app/investors)

---

## Why Conviction

Polymarket and Kalshi indexed US politics and ESPN. Conviction indexes
Naver, Weverse, Weibo, Pixiv, Instiz, and YouTube Data — the sources
APAC culture actually lives on. Three compounding moats:

1. **APAC-native Oracle.** 23 scrapers tuned per-domain (K-pop, LoL,
   NPB, Bollywood, macro, crypto). One disputed resolution across
   500+ closed markets.
2. **Permissionless market creation.** Any user proposes a market in
   ~45 seconds via the AI Wizard; 13 scrapers grade resolvability,
   evidence, and ambiguity before it ships. Cost per proposal is
   below $0.10.
3. **Vertical-video discovery.** The feed is mobile-native. K-pop
   MV, LCK highlight, NPB swing, anime teaser — the narrative plays
   while the market prices.

## Stack

- **Next.js 14** (App Router, server + client components)
- **TypeScript strict**
- **Tailwind CSS** with a custom palette
  (`ink`, `bone`, `volt`, `conviction`, `yes`, `no`)
- **State:** React Context + `useReducer` (positions, mute, i18n, toast,
  live prices). `localStorage` for persistence — no external state lib.
- **Charts:** Hand-rolled SVG (sparklines, dials, price area). No
  third-party chart deps.
- **Fonts:** Inter, Instrument Serif, JetBrains Mono (self-hosted).
- **Testing:** Playwright smoke — chromium desktop + 6 mobile
  projects (iPhone SE / 14 / 14-webkit / Pixel 5 / Galaxy S9+ /
  synthesized S25 Ultra class).
- **Deploy:** Vercel + `@vercel/og` dynamic OG images.

No database, no auth, no API keys. All market data is fixtured in
`lib/markets.ts`. Clone, `npm install`, `npm run dev` → full product
end-to-end in under a minute.

## Getting started

```bash
git clone https://github.com/seonkistall/conviction-fe.git
cd conviction-fe
npm install
npm run dev
# open http://localhost:3000
```

Build + Playwright smoke locally:

```bash
npm run build
npm run e2e              # all smoke projects
npm run e2e:chromium     # desktop chromium only
```

Against production:

```bash
E2E_BASE_URL=https://conviction-fe.vercel.app npm run e2e:chromium
```

## Routes

| Route                | Purpose                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `/`                  | Landing — Hero, Trending, Narrative Indices, Agentic Traders, Vibe Meter, APAC Drop Calendar, Permissionless section, full market grid |
| `/feed`              | TikTok-style vertical feed. YES/NO bottom sheet, double-tap, pull-to-refresh, end-of-feed terminator |
| `/markets/[slug]`    | Market detail — hero video, price chart, Evidence Bundle side sheet, Notify-me CTA, related markets, OrderBook |
| `/markets/new`       | AI Market Wizard — parse → route → scrape 13 sources → Qwen3 draft → Sonnet verify → publish |
| `/portfolio`         | Holdings, Watchlist (v2.25), Conviction Score (v2.25), Hot positions, activity feed      |
| `/leaderboard`       | Top traders with Human / Agentic segmented filter                                        |
| `/traders/[handle]`  | Per-trader profile + Conviction-style card                                               |
| `/narratives/[slug]` | Basket of markets grouped by cultural narrative                                          |
| `/methodology`       | How the Oracle works — 23 sources, evidence, resolution                                  |
| `/worlds-2026`       | LoL Worlds 2026 hub                                                                      |
| `/investors`         | Tier-1 seed-round landing (v2.25)                                                        |

## Feature highlights

### Vertical Feed (`/feed`)

Full-bleed `100dvh` cards with CSS `scroll-snap`. Each card is a
`<FeedCard>`:

- Right rail: Like (localStorage watchlist), Comment (demand-signal
  toast), Info button (opens `FeedDetailSheet`), Share (direct X
  intent with `@conviction_apac` handle).
- Tap YES/NO or multi-outcome → bottom sheet with market info +
  stake chooser ($5 / $10 / $25 / $100) + Confirm.
- Double-tap hearts + opens the sheet pre-picked to YES.
- Pull-to-refresh gesture (v2.26) rebuilds the feed with iOS
  rubberband feel.
- End-of-feed terminator card converts "I'm done" into a permissionless
  Propose CTA.
- Desktop: keyboard shortcuts (↑/↓ or j/k, Y/N for quick place, ⌘K
  search, ? help), left sidebar, ≤420px centered feed column.

### Market detail (`/markets/[slug]`)

Hero video auto-plays with a single-audio policy (only one unmuted
at a time, coordinated by `MuteProvider`). Below:

- Live price chart with 1D / 1W / 1M / ALL range tabs.
- Evidence Bundle side sheet — reasoning + 5–8 sources per market,
  grouped by category, with confidence scores.
- **Notify-me** (v2.25) — `mailto:` with prefilled per-market subject.
  Demand signal accumulates until sign-in ships.
- **Share on X** — uses the shared `lib/share.ts` helper.
- Related markets, cross-links to narratives + traders.

### Oracle (`/methodology`)

23-source evidence swarm: Naver, Weverse, Weibo, Pixiv, Instiz,
YouTube Data, KOSPI/KOSDAQ tickers, YNA, Brave, Exa, plus Chroma
RAG. Routed per question-domain (K-pop comeback → Weverse + Naver
News + Instiz; LoL Worlds → Riot API + Weibo + theqoo). 99.8%
accuracy across 500+ resolved markets with a human-oracle safety net.

### AI Market Wizard (`/markets/new`)

Ships a 45-second flow: user types a natural-language question →
wizard parses it → routes to 13 relevant scrapers → Qwen3 drafts a
resolution spec → Sonnet reviews → one-tap publish. Apple/Toss-level
micro-interactions (v2.21-5).

### Portfolio (`/portfolio`)

- Live stat row (total value, 24h P&L, realized P&L).
- Positions table with inline Close action.
- **Conviction Score** card (v2.25) — your hit-rate across all
  settled + open positions, broken out by category, with streak
  detection. Unlocks at ≥3 positions to stay on the signal side of
  the signal/noise boundary.
- **Watchlist** module (v2.25) — renders your hearted markets with
  live price + time-to-close. Same localStorage key as the Feed
  Heart.
- Hot Positions, raw activity feed, demo Deposit/Withdraw chips
  (routed to the Connect modal).

### Live prices

`lib/livePrices.tsx` runs a mean-reverting random walk on the client
at `TICK_MS=4000`, with `MAX_STEP=1.8pp` per tick. Viewport-gated
(`LiveMarketGrid` uses IntersectionObserver to freeze prices for
off-screen cards). `<LivePrice showDirection />` (v2.25) adds a
Polymarket-style ▲/▼ glyph + green/red flash on every change.

### Internationalization

English is canonical. Korean copy appears in a few places (political
outcome labels, some tags). The `lib/i18n.tsx` shim keeps the surface
pluggable for future locales. Text normalization (`NFC` + lowercase)
happens in the CommandPalette matcher so Hangul search works.

### Accessibility

- WCAG AA focus-visible sweep (v2.12).
- ARIA labels on every interactive element.
- `aria-live=polite` price announcements, rate-limited to 8s so
  screen readers don't flood on every tick.
- Reduced-motion respected — no price walk, no feed animations.
- Skip-to-main-content link in the layout root.

## Testing

- `tests/smoke.spec.ts` — route smoke, ⌘K palette, live ticker, OG
  images, ResolvedBanner.
- `tests/mobile.spec.ts` — mobile-fit overflow guard, Hero H1
  boundingBox, Header fit, Feed immersive chrome, MarketCard YES/NO
  buttons, preventDefault guard, Info sheet ESC close.
- `tests/visual.spec.ts` — Playwright pixel snapshots for Hero,
  markets grid, Feed card.
- `tests/og.spec.ts` — `/og/*` + `/twitter-image/*` pixel regression.

CI (`.github/workflows/ci.yml`) runs chromium on every push, plus
all 6 mobile projects (including WebKit with full system deps).

## Project structure

```
app/
  (route tree — page.tsx per route)
  feed/FeedClient.tsx      TikTok-style feed client
  markets/[id]/page.tsx    Market detail (SSG)
  markets/new/             AI Market Wizard
  portfolio/page.tsx       Holdings + Watchlist + Conviction Score
  investors/page.tsx       Seed-round landing (v2.25)
  layout.tsx               Providers: i18n, mute, live prices, positions, toast
components/
  AutoVideo.tsx            YouTube embed w/ poster fallback + tap-to-play recovery
  MarketCard.tsx           Grid card w/ LivePrice + QuickBet
  FeedCard.tsx             Feed full-bleed card + right rail
  FeedDetailSheet.tsx      YES/NO + stake sheet (binary)
  MultiOutcomeSheet.tsx    N-outcome pick + stake sheet (v2.26)
  OutcomeBar.tsx           Multi-outcome strip (legacy + useSheet mode)
  Watchlist.tsx            Portfolio Watchlist module
  ConvictionScoreCard.tsx  Portfolio hit-rate module
  ... ~60 components total
lib/
  types.ts                 Market / Position / Outcome / etc. contracts
  markets.ts               Fixture: markets, traders, activity, narratives
  positions.tsx            PositionsProvider — localStorage-backed
  livePrices.tsx           LivePricesProvider — mean-reverting walk
  mute.tsx                 MuteProvider — single-audio policy
  i18n.tsx                 Minimal i18n shim
  toast.tsx                ToastProvider — FIFO-capped stack of 3
  watchlist.ts             useWatchlist() over cv_feed_likes_v1
  convictionScore.ts       useConvictionScore() over positions.history
  share.ts                 xIntentUrl() + openXIntent() shared helper
  constants.ts             STAKE_PRESETS, BRAND_X_HANDLE, BRAND_BETA_EMAIL
tests/
  smoke.spec.ts / mobile.spec.ts / visual.spec.ts / og.spec.ts
```

## Version history (abbreviated)

| Version   | What shipped                                                                        |
| --------- | ----------------------------------------------------------------------------------- |
| v2.26     | Multi-outcome bottom sheet, positions schema widened to outcome ids, pull-to-refresh on feed, README rewrite |
| v2.25     | lib/constants, lib/share, lib/watchlist, Watchlist + Conviction Score + /investors, CI webkit |
| v2.24     | Comment coming-soon toast, deduped Share row in FeedDetailSheet                      |
| v2.23     | Feed YES/NO → order sheet, MECE categories, APAC Drop Calendar interleave, broken video ID + autoplay recovery |
| v2.22     | Parlay removed, Feed rail wired (Heart/Comment/Share), DebutCalendar APAC rebrand, Footer rewrite |
| v2.21     | 10 APAC markets (JP/IN/CN/SEA/KR mix), Propose-market interstitials, Hero CTA       |
| v2.20     | Connect modal, /methodology Evidence pattern, DebutCalendar scroll-snap, VibeMeter  |
| v2.19     | Toast consolidation, stake-based OrderBook presets, Demo badges, Parlay receipt    |
| v2.18     | PostTradeCard, Evidence side sheet grouping + reasoning prominence                  |
| v2.17     | Hero APAC reframing, AIConfidenceDial → evidence button, /feed escape route         |
| v2.16     | OG CSS triangle, visibilitychange + IO gating on live ticker, aria-live debounce    |
| v2.15     | LiveMarketGrid — every grid card ticks live                                         |
| v2.14     | CI Playwright, OG pixel regression, Leaderboard live prices                         |
| v2.13     | Hot Positions, Cmd+K palette, trader OG images                                      |
| v2.12     | Empty states, loading skeletons, focus-visible WCAG AA sweep                        |
| v2.11     | Mobile `/` → `/feed` redirect, Markets-grid inline YES/NO, FeedDetailSheet          |
| v2.10     | Pathname-aware chrome on /feed, double-tap YES, top progress                        |
| v2.6–v2.9 | Trade execution loop, OG images, SEO base, WebKit/Android audit, visual regression  |
| v2.0–v2.5 | Initial v2 — feed, wizard, evidence, narratives, moats                              |

## License + credits

Private repo. All market data, trader handles, AI Oracle output, and
evidence bundles are illustrative mocks for the pre-launch demo.
Video assets link to their respective YouTube uploaders; Conviction
does not claim ownership.

Questions / deck request / partnership: **beta@conviction.trade**
