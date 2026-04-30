# Conviction — Telegram Bot Backend

Minimal `/start` handler so newcomers see a welcome message + WebApp
button (Smoketest finding F-01). Deploys as a Vercel Edge Function on
the same project; webhook lives at `https://app.conviction.bet/api/telegram/webhook`.

## Setup

1. **BotFather** — set webhook:
   ```
   /setdomain   Conviction_Predict_bot   conviction-fe.vercel.app
   ```

2. **Vercel env var** (Production scope only, sensitive):
   ```
   TELEGRAM_BOT_TOKEN=<paste from /token>
   NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Conviction_Predict_bot
   NEXT_PUBLIC_TELEGRAM_APP_SHORT_NAME=open
   ```

3. **Webhook registration** — run once after first deploy:
   ```bash
   curl -F "url=https://conviction-fe.vercel.app/api/telegram/webhook" \
        https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook
   ```

4. **BotFather menu button** — point at the Mini App:
   - `/setmenubutton` → choose bot → button text `Open Conviction`
   - URL: `https://conviction-fe.vercel.app`

5. **BotFather commands**:
   ```
   /setcommands
   start - 🚀 Open Conviction
   markets - 🔥 Trending APAC markets
   portfolio - 💼 My positions
   propose - ✨ Propose a market with AI
   help - ❓ How it works
   ```

## Files

- `start-handler.ts` — sample webhook handler (drop into `app/api/telegram/webhook/route.ts`).
