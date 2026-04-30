/**
 * v2.28 — Haptic feedback helpers (TG-native first, vibrate fallback).
 *
 * Phase 1 used `navigator.vibrate` only. Inside Telegram that produces
 * either no buzz (iOS WebView blocks vibrate) or a flat single-pulse
 * (Android WebView). TG ships a richer HapticFeedback API that maps
 * directly to the host OS taptic engine — `light`/`medium`/`heavy`
 * impacts, `success`/`warning`/`error` notifications, and selection
 * change events. Using it inside TG makes confirms and bet placements
 * feel like a native iOS app instead of a web page.
 *
 * Routing rule:
 *   - In TG (`getTgWebApp()` non-null): always use the SDK.
 *   - Anywhere else: fall back to `navigator.vibrate` (Android browser
 *     responds; desktop/iOS Safari silently ignore).
 *
 * Respects `prefers-reduced-motion` — if the user has asked the OS to
 * calm things down, we drop all vibrations. This is the accessibility
 * equivalent of dimming UI animations.
 */

import { getTgWebApp } from './tgWebApp';

function reduceMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function vib(pattern: number | number[]) {
  if (typeof navigator === 'undefined') return;
  if (reduceMotion()) return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    /* Some embedded browsers throw when the host app blocks haptics. */
  }
}

/** Light tap — primary button press, quick confirm. ~10ms */
export function tap() {
  if (reduceMotion()) return;
  const tg = getTgWebApp();
  if (tg) {
    try {
      tg.HapticFeedback.impactOccurred('light');
      return;
    } catch {
      /* fall through to vibrate */
    }
  }
  vib(10);
}

/**
 * Medium impact — toggle, selection, secondary confirm. Slightly more
 * present than `tap` so the user feels a clear "yes, that registered".
 */
export function selectImpact() {
  if (reduceMotion()) return;
  const tg = getTgWebApp();
  if (tg) {
    try {
      tg.HapticFeedback.selectionChanged();
      return;
    } catch {
      /* fall through */
    }
  }
  vib(12);
}

/** Crisp success pulse — leg added, pick confirmed. */
export function success() {
  if (reduceMotion()) return;
  const tg = getTgWebApp();
  if (tg) {
    try {
      tg.HapticFeedback.notificationOccurred('success');
      return;
    } catch {
      /* fall through */
    }
  }
  vib([8, 24, 18]);
}

/** Heavier confirmation — position placed, on-chain commit. */
export function commit() {
  if (reduceMotion()) return;
  const tg = getTgWebApp();
  if (tg) {
    try {
      tg.HapticFeedback.impactOccurred('heavy');
      // Follow with a success pulse so it reads as "big action +
      // it succeeded" rather than just "big action".
      window.setTimeout(() => {
        try {
          tg.HapticFeedback.notificationOccurred('success');
        } catch {
          /* ignore */
        }
      }, 80);
      return;
    } catch {
      /* fall through */
    }
  }
  vib([14, 30, 14, 30, 22]);
}

/** Warn / error — invalid action, leg rejected, network error. */
export function warn() {
  if (reduceMotion()) return;
  const tg = getTgWebApp();
  if (tg) {
    try {
      tg.HapticFeedback.notificationOccurred('warning');
      return;
    } catch {
      /* fall through */
    }
  }
  vib([18, 50, 18]);
}
