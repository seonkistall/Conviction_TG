/**
 * v2.28 — Telegram Mini App SDK type-safe wrapper (Phase 2).
 *
 * Phase 1 (v2.27) called `window.Telegram.WebApp` directly inside
 * `<TelegramAdapter />`. Phase 2 introduces three more surfaces that
 * touch the SDK from outside that adapter:
 *
 *   1. MainButton (sticky bottom CTA on market detail) — driven by a
 *      hook that any client component can subscribe to.
 *   2. HapticFeedback (replacing the navigator.vibrate fallback in
 *      lib/haptics.ts when running inside TG).
 *   3. start_param routing (deeplink to a market on first paint).
 *
 * Centralising the SDK access here keeps the type shape in one
 * place and gives every consumer a single SSR-safe accessor.
 *
 * Outside Telegram every export is a no-op. We never throw.
 */

// -- Types -------------------------------------------------------------

/**
 * Subset of TG WebApp 7.x we touch. The full type lives at
 * @twa-dev/types if we ever pull that dep — we deliberately stay
 * dependency-free here so the wrapper never adds a runtime cost.
 */
export interface TelegramWebApp {
  ready(): void;
  expand(): void;
  close(): void;
  isExpanded: boolean;
  disableVerticalSwipes?: () => void;
  themeParams: Record<string, string | undefined>;
  colorScheme: 'light' | 'dark';
  viewportHeight: number;
  viewportStableHeight: number;
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      is_premium?: boolean;
      photo_url?: string;
    };
    auth_date?: number;
    hash?: string;
    /**
     * Param passed via t.me/<bot>/<app>?startapp=<value> deeplink.
     * Conviction uses this for `market_<slug>`, `feed`, `propose`.
     */
    start_param?: string;
  };
  BackButton: {
    show(): void;
    hide(): void;
    isVisible: boolean;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(cb: () => void): void;
    offClick(cb: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(p: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  shareToStory?: (mediaUrl: string, params?: { text?: string }) => void;
  switchInlineQuery?: (query: string, choose_chat_types?: string[]) => void;
  version: string;
  platform: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

// -- Accessor ---------------------------------------------------------

/**
 * SSR-safe accessor. Returns `null` on the server, in non-TG browsers,
 * and during the brief window before `telegram-web-app.js` finishes
 * loading. Callers must always handle `null`.
 */
export function getTgWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

/**
 * `true` only when running inside the actual Telegram client. False
 * on conviction-tg.vercel.app opened in a regular browser, false
 * during SSR, false in tests.
 *
 * Use this to gate UI that should only show in TG (e.g. native share
 * button replacing the X intent fallback).
 */
export function isInTelegram(): boolean {
  const tg = getTgWebApp();
  // initData is empty string outside TG; non-empty (signed payload)
  // when launched inside the actual client.
  return tg !== null && tg.initData.length > 0;
}

/**
 * The user's TG client language code, lowercased ISO 639-1.
 * Returns `null` if outside TG or if the client withheld it (rare).
 */
export function getTgLanguage(): string | null {
  const tg = getTgWebApp();
  return tg?.initDataUnsafe.user?.language_code?.toLowerCase() ?? null;
}

/**
 * Normalised region key derived from TG language. Drives the home
 * page region-aware featured market (F-06).
 *
 *   ko          → 'kr'
 *   ja          → 'jp'
 *   zh / zh-cn  → 'cn'
 *   zh-tw       → 'tw'
 *   hi / ta / ...→ 'in'
 *   id / ms / vi → 'sea'
 *   else        → 'apac' (default APAC fallback, never 'us')
 */
export function getTgRegion():
  | 'kr'
  | 'jp'
  | 'cn'
  | 'tw'
  | 'in'
  | 'sea'
  | 'apac' {
  const lang = getTgLanguage();
  if (!lang) return 'apac';
  if (lang.startsWith('ko')) return 'kr';
  if (lang.startsWith('ja')) return 'jp';
  if (lang === 'zh-tw' || lang === 'zh-hk') return 'tw';
  if (lang.startsWith('zh')) return 'cn';
  if (['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'ml', 'kn', 'pa'].includes(lang))
    return 'in';
  if (['id', 'ms', 'vi', 'th', 'tl', 'fil'].includes(lang)) return 'sea';
  return 'apac';
}

/**
 * Read `start_param` from the deeplink. Returns `null` if absent.
 *
 * Conviction conventions:
 *   - `market_<slug>`   -> /markets/<slug>
 *   - `feed`            -> /feed
 *   - `propose`         -> /markets/new
 *   - `propose_<query>` -> /markets/new?q=<decoded>
 */
export function getTgStartParam(): string | null {
  const tg = getTgWebApp();
  return tg?.initDataUnsafe.start_param ?? null;
}

/**
 * Build a t.me deeplink that opens the WebApp at a specific surface.
 * Used by the share button when `isInTelegram()` so the receiving
 * group-chat user lands on the market with one tap (the F-10 viral
 * loop).
 */
export function tgDeeplink(startApp: string): string {
  const bot =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ??
    'Conviction_Predict_bot';
  const shortName =
    process.env.NEXT_PUBLIC_TELEGRAM_APP_SHORT_NAME ?? 'open';
  return `https://t.me/${bot}/${shortName}?startapp=${encodeURIComponent(
    startApp
  )}`;
}

/**
 * Open a URL using TG's native handler when available, fall back
 * to window.open otherwise.
 */
export function openExternal(url: string): void {
  const tg = getTgWebApp();
  if (tg?.openLink) {
    tg.openLink(url, { try_instant_view: false });
    return;
  }
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Open a t.me link inside TG natively (for share-back-into-TG flows).
 * Falls back to openExternal when not in TG.
 */
export function openTelegramLink(url: string): void {
  const tg = getTgWebApp();
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
    return;
  }
  openExternal(url);
}
