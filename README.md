# Conviction — Frontend (v2)

The first **Asia-native, AI-powered prediction market**. Every market is
a "living card": immersive video of the actual narrative auto-plays in-line
(K-pop MV, LCK highlight, KBO swing, crypto B-roll), and Conviction layers
on the things a prediction market for Asia actually needs:

- a **TikTok-style vertical feed** tuned for mobile-first APAC traffic,
- **multi-outcome markets + parlays** so you can stack cultural theses,
- a **Conviction Oracle** pipeline with 23 scrapers, evidence bundles, and
  agentic traders you can copy-trade live on-chain, and
- **Asia-native moats** — a Narrative Index suite, a K-Culture Debut Radar,
  and a cultural-sentiment Vibe Meter — wrapped in a bilingual UI
  (English default, Korean toggle).

## Stack

- **Next.js 14** (App Router, server components where sensible)
- **TypeScript** (strict)
- **Tailwind CSS** — custom Conviction palette (`ink`, `bone`, `volt`, `conviction`, `yes`/`no`)
- **Zero external state manager** — React Context + `useReducer` for parlay,
  mute, and i18n. localStorage / sessionStorage / cookies for persistence.
- **Zero chart deps** — sparklines, conic-gradient dials, and the price area
  chart are all hand-rolled SVG.
- Fonts: Inter + Instrument Serif + JetBrains Mono.

No database, no auth — all data is mocked in `lib/markets.ts` so you can
clone, `npm install`, `npm run dev`, and see the full product end-to-end.

## Getting started

```bash
cd conviction-fe
npm install
npm run dev
# open http://localhost:3000
```

## Pages

| Route              | What's there                                                              |
| ------------------ | ------------------------------------------------------------------------- |
| `/`                | Landing — Hero, Trending, Narrative Indices, Agentic Traders, Vibe Meter, Debut Calendar, How-it-works, full market grid |
| `/feed`            | **TikTok-style vertical feed** — swipe full-bleed markets, quick YES/NO, one-tap add-to-parlay |
| `/markets/[slug]`  | Market detail — hero video, price chart, resolution criteria, AI Oracle w/ Evidence Bundle side sheet, related markets |
| `/markets/new`     | **AI Market Wizard** — type a question, watch Parse → Route → Scrape (13 sources) → Qwen3 draft → Sonnet verify → Publish |
| `/portfolio`       | Holdings, PnL, activity feed                                              |
| `/leaderboard`     | Top traders — human + agentic                                             |

## v2 highlights (what Conviction ships)

### Vertical Feed (`/feed`)
Full-bleed `100dvh` cards with CSS scroll-snap (`snap-feed` utility). Each
card is a `<FeedCard>` with right-rail social actions (like, comment,
**+ Parlay**, share), an IntersectionObserver tracks the active card, and the
global Mute FAB can unmute the whole feed with one tap. Binary markets show
inline YES/NO buttons; multi-outcome markets show the `OutcomeBar` strip.

### Multi-outcome markets + parlays
- `Market.kind` is `'binary' | 'multi'`. Multi markets carry an `outcomes[]`
  with colors and implied probs.
- `OutcomeBar` renders a stacked probability strip + click-to-pick buttons.
  Every pick dispatches `parlay.add({ marketId, pick, price })`.
- `ParlaySlip` is a global drawer (bottom-sheet on mobile, right-rail on
  desktop). Combined multiplier = `1 / Π price_i`, max payout = stake ×
  multiplier. Stake presets at $10 / $25 / $100 / $500. Persisted in
  localStorage under `cv_parlay_v1`.

### Edge badges
When `Market.edgePP >= 5`, `<EdgeBadge>` shows the Conviction AI mispricing
delta inline on cards and the market detail. This is the visible "AI alpha
you can see" moat.

### Conviction Oracle + Evidence Bundle
`AIOracleCard` on every market detail exposes:
- Model (Qwen3-32B draft → Sonnet-4.6 verify).
- Confidence and direction vs. the market price.
- An **Inspect evidence bundle** button that opens `EvidenceSideSheet` — a
  right-side drawer with the full source list (provider, confidence dot,
  excerpt, retrieved-at timestamp).

### AI Market Wizard (`/markets/new`)
Typing a question streams a 6-phase agent pipeline on screen:
`idle → parse → route → scrape → judge → verify → publish → done`. Each
phase swaps a detail panel: parsed entities, the domain router (e.g.
`stack.kpop.v3`), the 13-scraper swarm, Qwen3's draft verdict, Sonnet's
cross-check, and a mock HOGC oracle publish receipt.

### Asia-native moats

- **Narrative Indices** — curated weighted baskets ("K-Pop Big 4 · FY26",
  "LCK Dominance Index", "Hallyu Goes Global") priced in ¢ with legs + weights.
- **Agentic Traders** — marketplace of AI quants (Conviction-v2, Allora-KR,
  Qwen3-32B, Sonnet-4.6). 30-day PnL, win rate, AUM, followers. Live dot
  when the bot is on-chain right now.
- **Vibe Meter** — cultural sentiment signals from Weverse / X / Instiz /
  Reddit / YouTube. Per-topic 0–100 score + 24-point sparkline + source tints.
- **K-Culture Debut Calendar** — horizontally scrolling timeline of HYBE /
  SM / YG / JYP / ADOR comebacks with heat bars and a "Create market" /
  "View market" CTA per event.

### i18n (EN / KO)
Light-weight: no `next-intl`, no JSON fetch. `lib/i18n.tsx` ships two
dictionaries (EN + KO) and a Context provider. `<LangToggle>` in the header
persists the choice to cookie `cv_lang`. About 70 keys covered across nav,
hero, market card, parlay, feed, oracle, wizard, and moat components.

### Global Mute FAB
Bottom-left FAB toggles audio on every on-screen `<video>`. Browser autoplay
policy still requires videos to start muted; after the first user tap the
provider walks the DOM and unmutes everything at once. State persists to
sessionStorage under `cv_mute`.

## File layout (the interesting parts)

```
conviction-fe/
├─ app/
│  ├─ layout.tsx             # I18n / Mute / Parlay providers + global FABs
│  ├─ page.tsx               # Landing: Hero + 4 moats + HowItWorks + catalog
│  ├─ feed/                  # TikTok vertical feed
│  │  ├─ page.tsx
│  │  └─ FeedClient.tsx
│  ├─ markets/
│  │  ├─ [id]/page.tsx       # Binary → OrderBook, Multi → OutcomeBar rail
│  │  └─ new/                # AI Market Wizard
│  │     ├─ page.tsx
│  │     └─ NewMarketClient.tsx
│  ├─ portfolio/page.tsx
│  └─ leaderboard/page.tsx
├─ components/
│  ├─ AgenticTraders.tsx     # Moat
│  ├─ AIOracleCard.tsx
│  ├─ AllMarketsHeading.tsx
│  ├─ AutoVideo.tsx          # hybrid mp4 / youtube-nocookie iframe
│  ├─ CategoryTabs.tsx
│  ├─ DebutCalendar.tsx      # Moat
│  ├─ EdgeBadge.tsx
│  ├─ EvidenceSideSheet.tsx
│  ├─ FeedCard.tsx
│  ├─ Footer.tsx
│  ├─ GlobalMuteFAB.tsx
│  ├─ Header.tsx
│  ├─ Hero.tsx
│  ├─ HowItWorks.tsx
│  ├─ LangToggle.tsx
│  ├─ MarketCard.tsx         # Now EdgeBadge + multi-aware
│  ├─ NarrativeIndices.tsx   # Moat
│  ├─ OrderBook.tsx
│  ├─ OutcomeBar.tsx
│  ├─ ParlaySlip.tsx
│  ├─ PriceChart.tsx
│  ├─ TrendingStrip.tsx
│  └─ VibeMeter.tsx          # Moat
├─ lib/
│  ├─ format.ts
│  ├─ i18n.tsx               # Provider + EN/KO dicts
│  ├─ markets.ts             # All mock data + Moat datasets
│  ├─ mute.tsx               # Provider
│  ├─ parlay.tsx             # Provider + reducer + math
│  └─ types.ts
└─ README.md
```

## Video sourcing

Hybrid, matching the product direction:

1. **`mp4`** — short royalty-free culture/sport B-roll from Pexels. In
   production these would move to the Conviction CDN (Mux or Cloudflare
   Stream) for licensed footage.
2. **`youtube`** — official video IDs rendered via `youtube-nocookie.com`
   embeds with `autoplay=1&mute=1&loop=1&playlist=<id>` so K-pop MVs and
   LCK highlights play inline without third-party cookies.

`AutoVideo` decides which renderer to use based on `media.kind`, lazy-mounts
with IntersectionObserver, and cooperates with the global Mute provider.

## What would change in production

- Real order book + AMM, not the 9-row mock in `OrderBook`.
- Real WebSocket price + trade stream (the "Live · websocket" label).
- Replace the `SCRAPERS` array + setTimeout pipeline with the actual
  ResearchSwarm backend (Qwen3 / Sonnet + 23 real retrievers).
- Sign-in, wallet connect, and on-chain settlement via HOGC oracle.
- Licensed media CDN.
- Full translations beyond the ~70 strings currently bilingual.
