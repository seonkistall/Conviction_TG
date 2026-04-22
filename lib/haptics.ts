/**
 * Haptic feedback helpers.
 *
 * The Vibration API (`navigator.vibrate`) is supported on virtually every
 * Android browser and, since Chrome 32, is a no-op (but not an error) on
 * desktop. iOS Safari does NOT expose vibrate — but WebKit silently
 * ignores the call there too. So we can safely feature-detect once and
 * then fire-and-forget.
 *
 * Respects `prefers-reduced-motion` — if the user has asked the OS to
 * calm things down, we drop all vibrations. This is the accessibility
 * equivalent of dimming your UI animations.
 */

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
  vib(10);
}

/** Crisp success pulse — leg added, pick confirmed. Short-long. */
export function success() {
  vib([8, 24, 18]);
}

/** Heavier confirmation — parlay PLACED on chain. Tri-pulse. */
export function commit() {
  vib([14, 30, 14, 30, 22]);
}

/** Warn / error — invalid action, leg rejected. Two shorts. */
export function warn() {
  vib([18, 50, 18]);
}
