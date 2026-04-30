'use client';

/**
 * v2.28 — Telegram MainButton hook + provider (Phase 2).
 *
 * Background: TG WebApp 7.x exposes a sticky bottom CTA called
 * "MainButton" — pinned to the safe-area, themed by the user's TG
 * client, automatically Eskimo'd to the right corner on Android.
 * Polymarket's TG bot, Hamster Kombat, Notcoin — every serious
 * Mini App lives or dies by how it uses this button. It's the
 * single highest-attention surface in the entire viewport.
 *
 * Phase 1 (v2.27) deliberately deferred MainButton wiring — the
 * adapter only handled ready/expand/theme/BackButton. Phase 2 adds
 * the hook so any client component can ask the SDK to render
 * "Buy YES ¢41" as the primary action.
 *
 * Design: a single MainButton lives at the SDK level — only one
 * subscriber wins. We use a tiny FILO stack so a deeper component
 * (e.g. a buy modal) can temporarily override the parent's button
 * (e.g. the market detail's "Buy YES") and restore on unmount. This
 * matches how iOS UINavigationController handles bar buttons.
 *
 * Outside Telegram the hook is a complete no-op — never throws,
 * never mounts UI, never changes state. Component code can call it
 * unconditionally and the regular browser keeps its in-page CTA.
 */

import { useEffect, useRef } from 'react';
import { getTgWebApp, isInTelegram } from './tgWebApp';

export interface TgMainButtonState {
  /** Visible label, e.g. `Buy YES ¢41` */
  text: string;
  /** Tap handler. */
  onClick: () => void;
  /**
   * Background colour. Defaults to the brand `volt` lime so YES bets
   * feel green. Override with `theme.button_color` for default-themed
   * actions like "Confirm".
   */
  color?: string;
  /** Text colour. Defaults to ink-900 for high contrast on volt. */
  textColor?: string;
  /** Disable taps (e.g. while a request is in flight). */
  disabled?: boolean;
  /** Show TG's spinner overlay. */
  loading?: boolean;
}

type Subscription = TgMainButtonState & { id: number };

const subscribers: Subscription[] = [];
let nextId = 1;
let lastClickHandler: (() => void) | null = null;

/**
 * Apply the top-of-stack subscription to TG's actual MainButton.
 * Called on every push/pop/state-update.
 */
function reconcile() {
  const tg = getTgWebApp();
  if (!tg) return;
  const top = subscribers[subscribers.length - 1];

  if (!top) {
    if (lastClickHandler) {
      tg.MainButton.offClick(lastClickHandler);
      lastClickHandler = null;
    }
    tg.MainButton.hide();
    return;
  }

  // Swap click handler — TG's offClick requires the *exact* fn ref.
  if (lastClickHandler) {
    tg.MainButton.offClick(lastClickHandler);
  }
  lastClickHandler = top.onClick;
  tg.MainButton.onClick(top.onClick);

  tg.MainButton.setParams({
    text: top.text,
    color: top.color ?? '#C7F34A', // brand volt
    text_color: top.textColor ?? '#05060A', // brand ink-900
    is_active: !top.disabled,
    is_visible: true,
  });

  if (top.loading) {
    tg.MainButton.showProgress(true);
  } else {
    tg.MainButton.hideProgress();
  }
}

/**
 * Subscribe a component to the TG MainButton. The most-recently-
 * mounted component wins; on unmount the previous subscription is
 * restored (FILO stack), exactly like a navigation bar.
 *
 * Outside TG: no-op.
 *
 * @example
 *   useTgMainButton({
 *     text: 'Buy YES ¢' + Math.round(yesProb * 100),
 *     onClick: () => openBuyModal('YES'),
 *   });
 */
export function useTgMainButton(state: TgMainButtonState | null) {
  // Stable id per component instance.
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) {
    idRef.current = nextId++;
  }

  // Re-bind whenever any field of state changes. Splitting into
  // discrete deps would force callers to wrap onClick in useCallback;
  // re-running the effect on identity change is cheap enough.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isInTelegram()) return;
    if (!state) return;

    const id = idRef.current as number;
    const sub: Subscription = { id, ...state };
    subscribers.push(sub);
    reconcile();

    return () => {
      const idx = subscribers.findIndex((s) => s.id === id);
      if (idx !== -1) subscribers.splice(idx, 1);
      reconcile();
    };
  }, [
    state?.text,
    state?.onClick,
    state?.color,
    state?.textColor,
    state?.disabled,
    state?.loading,
    state, // also re-run when caller swaps null <-> state
  ]);
}
