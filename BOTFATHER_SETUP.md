# BotFather + TON Connect — One-Time Setup

> Run-once steps Sean performs in BotFather and Vercel after the
> Sprint-1 deploy. Bot token never goes in source — only in Vercel
> Production env vars.

## 1. BotFather (`@BotFather` in Telegram)

```text
/setcommands
@Conviction_Predict_bot
↓ paste:
start - 🚀 Open Conviction
markets - 🔥 Trending APAC markets
portfolio - 💼 My positions
propose - ✨ Propose a market with AI
help - ❓ How it works
```

```text
/setdescription
The first Asia-native prediction market on Telegram.
Trade your conviction on K-pop, e-sport, anime, BTC at the Tokyo open.
Powered by 23-source AI evidence swarm. Live in beta.
```

```text
/setabouttext
Asia-native prediction market. AI-graded resolution. Beta.
```

### Menu button → Mini App
```text
/setmenubutton
@Conviction_Predict_bot
Configure menu button
text:  Open Conviction
url:   https://conviction-tg.vercel.app
```

### Register the Mini App (if not already)
```text
/newapp
@Conviction_Predict_bot
title:        Conviction
description:  Asia-native prediction market
photo:        640x360 PNG
demo gif:     30s wow recording
url:          https://conviction-tg.vercel.app
short name:   open    (deeplink: t.me/Conviction_Predict_bot/open)
```

### Token (one-time)
```text
/token   →   copy
Vercel → Project → Settings → Environment Variables → Production:
  TELEGRAM_BOT_TOKEN = <token>
  TELEGRAM_WEBHOOK_SECRET = <random 32-char hex>
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME = Conviction_Predict_bot
  NEXT_PUBLIC_TELEGRAM_APP_SHORT_NAME = open
```

## 2. Webhook registration (one-time, after deploy)

```bash
curl -F "url=https://conviction-tg.vercel.app/api/telegram/webhook" \
     -F "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
     "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook"
```

Verify:
```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
# expect: "url": "https://conviction-tg.vercel.app/api/telegram/webhook"
```

## 3. TON Connect manifest

Already shipped at `public/tonconnect-manifest.json` and served at
`https://conviction-tg.vercel.app/tonconnect-manifest.json`. Validate
with:
```bash
curl -i https://conviction-tg.vercel.app/tonconnect-manifest.json
# expect 200 + access-control-allow-origin: *
```

## 4. Acceptance — Sean smoke-test after deploy

1. Send `/start` to `@Conviction_Predict_bot` — bot replies in <2s with
   welcome + "🚀 Open Conviction" inline button.
2. Tap the Menu button — Mini App opens to the home page.
3. In a TG group, paste:
   `https://t.me/Conviction_Predict_bot/open?startapp=market_btc-150k-eoy`
   — tap. Mini App opens directly on the BTC market detail.
4. On that page, the green sticky "Buy YES ¢XX" button is visible
   (not OrderBook on the right rail — the TG MainButton).
5. Tap it → bottom sheet with stake presets → tap MainButton again
   → haptic success + toast.
6. From the same market, tap Share — TG share sheet opens, link
   payload contains `startapp=market_btc-150k-eoy`.
