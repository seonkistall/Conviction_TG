/**
 * v2.28.3 — Self-service webhook registration (one-shot).
 *
 * Background: registering a TG bot webhook traditionally requires a
 * `curl` call from the operator's terminal with the bot token in the
 * URL. To avoid the bot token ever leaving secure storage (Vercel env
 * vars), this endpoint performs the registration server-side using
 * the env vars Vercel already holds.
 *
 * Flow:
 *   GET /api/telegram/setup?token=<TELEGRAM_WEBHOOK_SECRET>
 *
 * The token query param must match TELEGRAM_WEBHOOK_SECRET (which is
 * the same secret TG injects into the webhook headers — operator
 * already needs to know it). Anyone without the secret hits 401.
 *
 * On success the handler:
 *   1. Calls Telegram's setWebhook with the production URL +
 *      drop_pending_updates so any old retries are flushed.
 *   2. Calls getWebhookInfo to verify the registration.
 *   3. Returns both responses as JSON for the operator to inspect.
 *
 * This endpoint is idempotent — safe to hit multiple times. Does not
 * mutate state beyond what setWebhook would do via curl.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const WEBAPP_URL =
  process.env.NEXT_PUBLIC_WEBAPP_URL ?? 'https://conviction-tg.vercel.app';

export async function GET(req: NextRequest) {
  const provided = req.nextUrl.searchParams.get('token');

  // The query token must match the webhook secret. We require both env
  // vars to be present — refuse to operate on a half-configured
  // project.
  if (!WEBHOOK_SECRET || !BOT_TOKEN) {
    return NextResponse.json(
      {
        error: 'env vars missing',
        hasToken: Boolean(BOT_TOKEN),
        hasSecret: Boolean(WEBHOOK_SECRET),
        hint:
          'Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in Vercel ' +
          'Production env vars, then redeploy.',
      },
      { status: 500 }
    );
  }
  if (provided !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const webhookUrl = `${WEBAPP_URL}/api/telegram/webhook`;

  // 1. Register the webhook
  const setForm = new FormData();
  setForm.append('url', webhookUrl);
  setForm.append('secret_token', WEBHOOK_SECRET);
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

  // 2. Verify with getWebhookInfo
  const infoRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`
  );
  const infoBody = (await infoRes.json()) as {
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
  };

  // 3. Verify the bot itself is reachable (sanity check on token)
  const meRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
  );
  const meBody = (await meRes.json()) as {
    ok: boolean;
    result?: { id: number; username: string; first_name: string };
  };

  return NextResponse.json(
    {
      setResult: setBody,
      info: infoBody,
      bot: meBody,
      registeredAt: new Date().toISOString(),
      registeredUrl: webhookUrl,
    },
    {
      // Make sure the response isn't cached — operators may rerun this
      // after fixing config and want a fresh result every time.
      headers: { 'cache-control': 'no-store' },
    }
  );
}
