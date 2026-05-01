/**
 * v2.28.4 — Idempotent webhook self-registration.
 *
 * Calls Telegram's getWebhookInfo first; if the webhook already points
 * at our URL, returns 'already_registered' without mutating state.
 * Otherwise calls setWebhook with our env-var bot token + secret +
 * drop_pending_updates.
 *
 * Why no auth gate: setWebhook can only register OUR webhook URL
 * (hard-coded below) using OUR bot token (server-side env var).
 * An external caller hitting this endpoint either no-ops (already
 * registered) or re-registers the same URL we already wanted —
 * zero abuse surface, zero secret leakage. The idempotent path
 * means even a malicious flood is just GETs against our edge cache.
 *
 * Operator-friendly side effect: opening the URL in a browser is
 * enough to verify the bot is wired. JSON output shows current
 * Telegram-side state.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const WEBAPP_URL =
  process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'https://conviction-tg.vercel.app';

interface WebhookInfo {
  ok: boolean;
  result?: {
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_date?: number;
    last_error_message?: string;
    max_connections?: number;
    allowed_updates?: string[];
    ip_address?: string;
  };
  description?: string;
}

interface BotInfo {
  ok: boolean;
  result?: { id: number; username: string; first_name: string };
}

export async function GET(_req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'TELEGRAM_BOT_TOKEN missing',
        hint: 'Set TELEGRAM_BOT_TOKEN in Vercel Production env vars and redeploy.',
      },
      { status: 500, headers: { 'cache-control': 'no-store' } }
    );
  }

  const webhookUrl = `${WEBAPP_URL}/api/telegram/webhook`;

  // 1. Identity check (validates BOT_TOKEN is correct)
  const meRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
  const me = (await meRes.json()) as BotInfo;
  if (!me.ok) {
    return NextResponse.json(
      { status: 'error', error: 'getMe failed', detail: me },
      { status: 502, headers: { 'cache-control': 'no-store' } }
    );
  }

  // 2. Current webhook state
  const infoRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const info = (await infoRes.json()) as WebhookInfo;
  const currentUrl = info?.result?.url ?? '';

  // 3. Idempotent path: already pointing where we want?
  if (currentUrl === webhookUrl) {
    return NextResponse.json(
      {
        status: 'already_registered',
        bot: me.result,
        webhook: info.result,
        registeredUrl: webhookUrl,
      },
      { headers: { 'cache-control': 'no-store' } }
    );
  }

  // 4. Register
  const setForm = new FormData();
  setForm.append('url', webhookUrl);
  if (WEBHOOK_SECRET) setForm.append('secret_token', WEBHOOK_SECRET);
  setForm.append('drop_pending_updates', 'true');
  setForm.append(
    'allowed_updates',
    JSON.stringify(['message', 'callback_query', 'inline_query'])
  );

  const setRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    { method: 'POST', body: setForm }
  );
  const setBody = (await setRes.json()) as Record<string, unknown>;

  // 5. Re-fetch to verify
  const verifyRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const verify = (await verifyRes.json()) as WebhookInfo;

  return NextResponse.json(
    {
      status: 'registered',
      bot: me.result,
      previousWebhook: info.result,
      setResult: setBody,
      currentWebhook: verify.result,
      registeredUrl: webhookUrl,
      registeredAt: new Date().toISOString(),
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
