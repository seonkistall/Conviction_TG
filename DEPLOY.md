# Deploy Conviction to Vercel

The project is framework-ready for Vercel — `vercel.json` is already in the
repo, there are no env vars (all data is mocked), and `next build` is the only
step.

Pick whichever path is fastest for you.

## Path A · Vercel CLI (≈ 60 seconds)

```bash
cd conviction-fe
npm install
npx vercel --yes            # first time: login via e-mail link
# hit enter on every prompt — the defaults are correct
# production deploy:
npx vercel --prod --yes
```

Output ends with a line like `✔ Production: https://conviction-fe-<hash>.vercel.app`.
That URL is the live site.

## Path B · Import from GitHub (dashboard)

1. Create a new GitHub repo (empty is fine).
2. From the project folder:
   ```bash
   cd conviction-fe
   git init
   git add .
   git commit -m "feat: conviction v2.1"
   git branch -M main
   git remote add origin git@github.com:<you>/conviction-fe.git
   git push -u origin main
   ```
3. Open https://vercel.com/new → Import that repo → accept defaults → Deploy.

Every subsequent `git push` redeploys. Preview URLs are generated for every PR.

## Path C · Drag-and-drop the zip

A zipped copy of the project is at
`/sessions/serene-gracious-hamilton/mnt/Conviction_PPTX/conviction-fe.zip` in
your workspace folder. Unzip it, then:

- `vercel.com/new` → "Deploy without Git" → select the `conviction-fe` folder.

Vercel detects Next.js automatically, runs `npm install && next build`, and
gives you a public URL.

## Local preview first (optional sanity check)

```bash
cd conviction-fe
npm install
npm run dev         # http://localhost:3000
```

Landing page → scroll past Trending → Narrative Indices → Agentic Traders
(click any card to see the new **trader detail page**) → Vibe Meter → Debut
Calendar. On first load you'll see the **3-slide onboarding intro**.

## What to smoke-test on the deployed URL

1. **Landing** (`/`) — all four moats render, MarketCards auto-play video.
2. **Feed** (`/feed`) — swipe between cards; hit `+` to send picks to the slip.
3. **Market detail** (`/markets/[slug]`) — open the **AI Oracle** side sheet.
4. **Market wizard** (`/markets/new`) — type a question, watch the 6-phase
   agent pipeline.
5. **Parlay receipt** — pick 2+ markets, tap **Place parlay**, wait ~1.3s for
   the on-chain "tx hash / block #" receipt. Tickets persist under
   `localStorage.cv_tickets_v1`.
6. **Portfolio** (`/portfolio`) — see the parlay tickets ledger below net-worth.
7. **Trader detail** (`/traders/ai.oracle.kr`) — 30-day PnL curve + recent picks
   + one-click **Copy-trade** toggle.
8. **Mobile bottom nav** — resize window under 768px, 5 tabs + raised `+ Propose`
   CTA appear at the bottom.
9. **Language toggle** — header `EN / KO` switches ~90 strings live.

## Known sandbox build note

`next build` can OOM in tight environments (< 2 GB). On Vercel's default
runtime it builds in ~45 seconds. If building locally on a small machine:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```
