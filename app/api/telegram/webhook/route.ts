/**
 * v2.28 — Telegram bot webhook handler (F-01).
 *
 * Drop into `app/api/telegram/webhook/route.ts` to enable. Handles:
 *   - /start [param]  →  welcome message + WebApp button (carrying any
 *                        deeplink payload through to Mini App via
 *                        start_param)
 *   - /help           →  one-line description + WebApp button
 *   - /markets        →  WebApp button to /feed
 *   - /portfolio      →  WebApp button to /portfolio
 *   - /propose        →  WebApp button to /markets/new
 *   - any other text  →  silent (no auto-reply spam)
 *
 * Deploys as an Edge Function for sub-100ms cold start. Validates the
 * webhook by checking the `X-Telegram-Bot-Api-Secret-Token` header
 * against env `TELEGRAM_WEBHOOK_SECRET` (set when registering the
 * webhook with `?secret_token=...`). Bypasses the check in dev.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBAPP_URL =
  process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'https://conviction-tg.vercel.app';
const SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

const TG = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * v2.28.1 — Webhook idempotency cache (F-21).
 *
 * Telegram retries webhook delivery for ~24h if the receiver doesn't
 * 200 fast enough. Without dedup the user gets the welcome message
 * twice when our cold start crosses TG's ~5s timeout, or N times if
 * an instance briefly fails to drain. Dedup window: 5 minutes is
 * well past TG's outer retry window for a single update_id and
 * costs effectively zero memory (~ <1 MB for tens of thousands of
 * ids).
 *
 * Edge instances are not perfectly sticky, so this is a best-effort
 * dedup that catches the *common* case of the same instance
 * receiving the retry. For multi-region deploys we'd back this with
 * Vercel KV; the in-memory implementation is sufficient through
 * beta when traffic is concentrated to a single region.
 */
const DEDUP_TTL_MS = 5 * 60 * 1000;
const dedup = new Map<number, number>(); // update_id → ms epoch first seen
function isDuplicate(updateId: number): boolean {
  const now = Date.now();
  // Drop expired entries opportunistically while we're here.
  if (dedup.size > 4096) {
    for (const [id, ts] of dedup) {
      if (now - ts > DEDUP_TTL_MS) dedup.delete(id);
    }
  }
  const seen = dedup.get(updateId);
  if (seen !== undefined && now - seen < DEDUP_TTL_MS) return true;
  dedup.set(updateId, now);
  return false;
}


interface TgUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

async function tgPost(method: string, body: unknown) {
  await fetch(`${TG}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * Reply with a message + a single inline WebApp button. The button
 * label and the deeplink payload (`url`) drive the user straight
 * into the Mini App; in TG, the WebApp button type opens in-place
 * (no external browser).
 */
function webAppReply(chatId: number, text: string, buttonText: string, path: string) {
  const url = `${WEBAPP_URL}${path}`;
  return tgPost('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: buttonText, web_app: { url } }],
      ],
    },
    disable_web_page_preview: true,
  });
}

export async function POST(req: NextRequest) {
  // Webhook auth — TG sends our secret token in this header when we
  // register the webhook with `?secret_token=...`. Reject anyone else.
  if (SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const update = (await req.json()) as TgUpdate;

  // Idempotency — a TG retry of the same update_id is a no-op.
  if (isDuplicate(update.update_id)) {
    return NextResponse.json({ ok: true, dedup: true });
  }

  const msg = update.message;
  const text = msg?.text;
  if (!msg || !text) {
    return NextResponse.json({ ok: true });
  }

  const chatId = msg.chat.id;

  // Match the *first token* of the message — '/start payload' splits
  // into ['/start', 'payload'].
  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(' ').trim();

  switch (cmd) {
    case '/start': {
      // Honour any deeplink payload by appending it as start_param so
      // the Mini App's TelegramAdapter can route to the right surface.
      const startApp = arg ? `?startapp=${encodeURIComponent(arg)}` : '';
      const path = startApp ? '/' + startApp : '/';
      const lead = arg
        ? `Welcome — opening "${arg}" for you.`
        : `🚀 <b>Welcome to Conviction.</b>`;
      const body = arg
        ? ''
        : (
            `\n\nThe first Asia-native prediction market.` +
            `\nTrade your conviction on K-pop, e-sport, anime, BTC at the Tokyo open.` +
            `\n\nTap below to start trading in 30 seconds.`
          );
      await webAppReply(chatId, lead + body, '🚀 Open Conviction', path);
      break;
    }

    case '/help': {
      await webAppReply(
        chatId,
        '<b>Conviction</b> — Asia-native prediction market.\n' +
          'Trade YES / NO on APAC narratives. AI-graded resolution from 23 sources.\n' +
          'Tap below to open the Mini App.',
        'Open Conviction',
        '/'
      );
      break;
    }

    case '/markets': {
      await webAppReply(
        chatId,
        '🔥 <b>Trending APAC markets</b>\nTap to open the live feed.',
        '🔥 Open feed',
        '/feed'
      );
      break;
    }

    case '/portfolio': {
      await webAppReply(
        chatId,
        '💼 <b>Your positions</b>',
        '💼 Open portfolio',
        '/portfolio'
      );
      break;
    }

    case '/propose': {
      await webAppReply(
        chatId,
        '✨ <b>Propose a market</b>\nType the question. Our agents do the rest.',
        '✨ Open propose',
        '/markets/new'
      );
      break;
    }

    default: {
      // Stay silent for non-command text — auto-replying to every
      // user message would feel spammy and is disallowed by TG bot
      // guidelines for groups.
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Health check for the deploy validator.
  return NextResponse.json({ ok: true, service: 'conviction-bot-webhook' });
}
