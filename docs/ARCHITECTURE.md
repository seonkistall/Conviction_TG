# Conviction — Architecture & Sprint-2 Backend Plan

> **Status**: living doc. Decisions are committed once the matching prefix `[ADR-N]` lands; bullets without an ADR are open questions.

---

## 0. Today's stack (post Sprint-1.2)

| Layer | Choice | Notes |
|---|---|---|
| App | Next.js 14 (App Router) | RSC + client islands |
| Lang | TypeScript strict | `tsc --noEmit` is CI gate |
| UI | Tailwind 3.4 + custom palette (`ink`, `bone`, `volt`, `conviction`, `yes`, `no`) | self-hosted Inter / Instrument Serif / JetBrains Mono / Noto KR/JP/SC |
| State | React Context + reducers + `localStorage` | no Redux, no Zustand |
| Data | `lib/markets.ts` fixture (60KB) wrapped by `lib/api.ts` | swap point for backend |
| Live trades | `lib/liveTrades.ts` mock interval (4s) | WS swap point on `NEXT_PUBLIC_LIVE_TRADES_WS_URL` |
| Bot backend | Vercel Edge Function (`app/api/telegram/webhook/route.ts`) | `update_id` LRU dedup |
| Auth | TG `initData` HMAC verifier (server, `lib/tgInitData.ts`) | not yet wired into a route |
| Wallet | TON Connect manifest at `/tonconnect-manifest.json` | UI flow not yet implemented |
| Hosting | Vercel | Production = `main`; preview per PR |
| CI | GitHub Actions: `ci` (Playwright smoke chromium + 6 mobile), `typecheck` (tsc + lint) | Sprint-1.2 adds `e2e:tg` |
| Telemetry | `@vercel/analytics`, `@vercel/speed-insights`, custom `lib/perfMarks.ts` (`cv:*`) | Sentry skeleton ready, DSN-gated |

---

## 1. Sprint-2 backend scope (north star)

> 30-day target: replace fixture with a real backend that survives a $5M seed-deal due-diligence and supports 100K WAU on a TG Mini App.

Required capabilities, ordered by criticality:

1. **Markets store** — CRUD + region/category/status filters + atomic price update.
2. **Order book / AMM** — clear yes/no pricing, slippage cap, partial fill.
3. **Positions** — per-user holdings, P&L, settle on resolution.
4. **Live trades** — server-pushed trade events, fan-out to WebSocket subscribers.
5. **AI Oracle ingest** — 23 scrapers, evidence bundle, resolution decision.
6. **Auth** — TG `initData` → Conviction user; TON Connect → wallet.
7. **Payments** — TON Connect tx submit + Telegram Stars onramp.
8. **Notifications** — push from bot for resolved markets, whale follows.

---

## 2. ADRs — backend decisions to make

### [ADR-1] Database — **Postgres on Supabase** (recommended)

| Option | Pros | Cons |
|---|---|---|
| Supabase Postgres | Managed PG + RLS + Realtime channels (free WS), Auth UI, dashboards. APAC region (Singapore, Tokyo). Free tier scales to demo. | Vendor coupling on Auth/Realtime if used heavily. Migration cost if leaving. |
| Neon | Branchable PG, generous free tier, no Realtime. | Need separate WS solution. |
| PlanetScale (Vitess MySQL) | Massive scale ceiling. | MySQL + lack of true FK + no native pubsub. |
| Self-hosted PG on Fly | Full control. | Ops overhead — not justified pre-Series A. |

**Pick**: Supabase. Use Postgres only at first; bring in Realtime channels for live trades (saves us writing a WebSocket service in Sprint-2).

### [ADR-2] WebSocket / live trades — **Supabase Realtime** (Phase 1) → **Custom Edge WS** (Phase 2)

- Phase 1: Supabase Realtime broadcasts `INSERT INTO trades` to a `trades:<market_id>` channel. Client opens one channel per visible market. ~10 markets per session × ~30K WAU = trivial fan-out.
- Phase 2: when concurrent open channels > 100K, split out a dedicated WS service (Cloudflare Durable Objects or Pusher) + Postgres logical replication.

`lib/liveTrades.ts` already exposes the right hook shape — Phase 1 swap is a one-line URL change.

### [ADR-3] Bot backend — **Vercel Edge → Cloudflare Workers** (Phase 2)

Stay on Vercel Edge through Sprint-2 (we already ship the webhook route there). Move to Cloudflare Workers when:
- Webhook latency p95 > 200ms, or
- We need cron-driven scrapers (Workers cron is cheap and reliable; Vercel cron has quotas).

### [ADR-4] AI Oracle scrapers — **Trigger.dev v3 + a Python worker pool**

23 scrapers per region. Concerns: rate limiting per source, JS-rendered pages (Naver, Weverse), CN-mainland blocklists.

| Component | Choice |
|---|---|
| Job orchestration | **Trigger.dev v3** — TypeScript-friendly, retries, scheduled, observable, free up to small scale |
| Headless browser | **Playwright** workers, one Docker image per region cluster (KR / JP / CN-via-HK proxy / IN / SEA) |
| Storage | Postgres `evidence` table + `evidence_blob` on Supabase Storage |
| LLM | Two stages: cheap drafter (Qwen3 7B via Together AI) + verifier (Claude Sonnet via Anthropic API) — cost cap $0.10/proposal |
| RAG | `pgvector` extension on Supabase for the per-domain knowledge index |

Drop-in Q1 follow-up: switch the domain RAG to Chroma if Supabase pgvector latency degrades > 200ms p95.

### [ADR-5] Auth — TG initData + TON Connect, no email/password

- Backend: `verifyTgInitData()` (already in `lib/tgInitData.ts`) at every protected route.
- User identity: `users.tg_user_id` is the primary key; wallet address is a secondary attribute set when TON Connect signs.
- Server-side session: short-lived JWT (15-min) signed with `BOT_TOKEN`, refreshed on every TG launch. No cookie.

### [ADR-6] Payments — TON Connect first, Telegram Stars onramp

- All bets settle on TON. We never custody fiat; we never custody Stars.
- Stars are converted to TON at the bot via `Stars → TON internal credit` ledger; user can later redeem credit for actual TON. Stars is the **frictionless first bet** for users without a wallet.
- Real-money flag is region-gated. Default in-app currency reads as `¢` so the experience is consistent regardless of underlying token.

---

## 3. Migration phases (fixture → backend)

| Phase | What changes | What stays | Estimate |
|---|---|---|---|
| **0 — Today (Sprint-1.2)** | `lib/api.ts` wraps fixture; `RecentTradesPanel` uses hook | Components import from fixture | ✅ done |
| **1 — DB read-only** | Provision Supabase, seed `markets` table from fixture, point `lib/api.ts` at it via `NEXT_PUBLIC_API_BASE_URL`. Live trades stay mock. | Components | 5 days |
| **2 — Live trades** | Supabase Realtime channel per market. Set `NEXT_PUBLIC_LIVE_TRADES_WS_URL`. Insert mock trades from a small Trigger.dev job. | Components | 3 days |
| **3 — Real trades** | Wire TON Connect, sign TX, write `trades` row, Realtime fans out. | Components | 7 days |
| **4 — AI Oracle ingest** | Trigger.dev scrapers per source, evidence bundle table, draft+verify LLM. | Components | 14 days |
| **5 — AI Oracle resolution** | Closed market → ingest snapshot → LLM judge → `markets.resolution` write. | Components | 7 days |
| **6 — Settlement** | Resolution → on-chain settlement TX → positions credited. | Components | 5 days |

Total to a fully real backend: ~40 days. Demo-grade (phases 1–3 + a single live category) achievable in ~2 weeks.

---

## 4. Hard rules (do not break)

- **Browser path stays alive**: `conviction-tg.vercel.app` opened in a regular browser must work without backend, without TG, with no env vars. Fixture is the safety net.
- **No env-var leak to client** for any secret. `NEXT_PUBLIC_*` only for non-sensitive (bot username, app short name, public API base, public Sentry DSN).
- **Hydration safety**: any TG-sniffing reorder commits in `useEffect`, never in `useState` initial value. SSR markup must match `getTgRegion() === 'apac'` baseline.
- **No external redirect** from inside a TG Mini App. All wallet / share / link flows route through TG SDK methods.
- **Webhook idempotency**: every TG `update_id` runs at most once. Already implemented; preserved across backend swap.

---

## 5. Open questions for Sean

These block ADRs above; please answer before Sprint-2 kickoff:

1. **Region of first DB write**? (Supabase Singapore vs Tokyo affects KR vs JP TTFB by ~30ms). Default: Tokyo.
2. **Stars onramp legal**? (We technically broker Stars → TON; some jurisdictions treat that as money transmission. Need a lawyer note before phase 3.)
3. **Domain custody**? (`conviction.bet` ownership / DNS access. Manifest URL stability matters for TON Connect cache.)
4. **Q3 2026 Telegram Stars Pro pricing**? (Affects unit economics on the Stars-first user.)

---

## 6. Out of scope (deferred past Sprint-2)

- Native iOS / Android apps (TG Mini App + group chat is the entire distribution layer).
- Liquidity provider / market-maker incentive contracts (Sprint-3, Series A story).
- Multi-currency UX (we keep `¢` everywhere; tokens are an accounting layer).
- DAO governance / on-chain market resolution voting (likely never; AI Oracle + dispute window is enough for APAC pop-culture markets).
