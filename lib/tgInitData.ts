/**
 * v2.28.1 — Telegram WebApp initData signature verification.
 *
 * Telegram signs the initData payload with a HMAC-SHA256 keyed by
 * SHA-256("WebAppData", BOT_TOKEN). Any backend route that promotes
 * a TG-claimed user id to an actual identity (placing a real bet,
 * crediting Stars, sending a notification) MUST verify that signature
 * before trusting the payload — otherwise an attacker can spoof any
 * TG user_id with a hand-rolled query string.
 *
 * This module is server-side only. Don't import it from a client
 * component. The bot token never leaves the server.
 *
 * Usage in an API route (Edge or Node):
 *   const ok = await verifyTgInitData(req.headers.get('x-tg-initdata'));
 *   if (!ok.valid) return Response.json({ error: 'bad signature' }, { status: 401 });
 *   const user = ok.user;  // { id, username, language_code, ... }
 */

export interface TgInitDataResult {
  valid: boolean;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  };
  authDate?: number;
  reason?: string;
}

/**
 * Verify the initDataRaw string against the bot token. Returns the
 * parsed user when valid; sets reason on failure.
 *
 * @param initDataRaw raw query string Telegram sends as initData
 * @param maxAgeSeconds reject signatures older than this. Default 1
 *   day, which matches TG's recommendation: shorter for sensitive
 *   actions (e.g. 5 min for payments).
 */
export async function verifyTgInitData(
  initDataRaw: string | null | undefined,
  maxAgeSeconds: number = 24 * 3600
): Promise<TgInitDataResult> {
  if (!initDataRaw) return { valid: false, reason: 'missing initData' };

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { valid: false, reason: 'TELEGRAM_BOT_TOKEN not set' };

  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) return { valid: false, reason: 'no hash' };
  params.delete('hash');

  // Build data_check_string per TG spec: keys sorted, joined "k=v\n".
  const pairs: string[] = [];
  // URLSearchParams iteration order matches insertion order; sort.
  const keys: string[] = [];
  params.forEach((_, k) => keys.push(k));
  keys.sort();
  for (const k of keys) pairs.push(`${k}=${params.get(k)!}`);
  const dataCheckString = pairs.join('\n');

  // secret_key = HMAC_SHA256("WebAppData", BOT_TOKEN)
  // hex(hmac_sha256(secret_key, data_check_string)) === hash ?
  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const secret = await crypto.subtle.sign('HMAC', secretKey, enc.encode(token));
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    enc.encode(dataCheckString)
  );
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed !== hash) return { valid: false, reason: 'bad signature' };

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate)) return { valid: false, reason: 'no auth_date' };
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > maxAgeSeconds) return { valid: false, reason: 'expired' };

  let user: TgInitDataResult['user'];
  try {
    const userRaw = params.get('user');
    if (userRaw) user = JSON.parse(userRaw);
  } catch {
    return { valid: false, reason: 'bad user json' };
  }

  return { valid: true, user, authDate };
}
