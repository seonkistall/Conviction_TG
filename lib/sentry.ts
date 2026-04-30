/**
 * v2.28.1 — Sentry skeleton.
 *
 * No-op until SENTRY_DSN is set (env var, not committed). The shape
 * matches @sentry/nextjs's Sentry.init so swapping in the real SDK
 * later is a one-line change in app/layout.tsx (import './sentry'
 * → import './sentry-real') with no consumer-side updates.
 *
 * Why ship a skeleton now: the rest of Sprint-1.1 emits errors the
 * future Sentry will want to capture (HapticFeedback failures,
 * websocket reconnects, market-not-found). Wrapping them in
 * `captureException()` from day 1 means flipping Sentry on in
 * production becomes a deploy, not a refactor.
 */

interface BreadcrumbInput {
  category: string;
  message: string;
  level?: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

let _enabled = false;

/**
 * Enable real Sentry once SENTRY_DSN is provisioned. Until then,
 * captureException() and addBreadcrumb() route to console.
 */
export function initSentry() {
  if (typeof process === 'undefined') return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  _enabled = true;
  // When a real SDK lands here, Sentry.init({ dsn, tracesSampleRate: 0.1, ... })
}

export function captureException(err: unknown, ctx?: Record<string, unknown>) {
  if (!_enabled) {
    // eslint-disable-next-line no-console
    console.error('[capture]', err, ctx);
    return;
  }
  // Real Sentry call lands here.
}

export function addBreadcrumb(b: BreadcrumbInput) {
  if (!_enabled) return; // breadcrumbs are noisy in dev console
  // Real Sentry call lands here.
}
