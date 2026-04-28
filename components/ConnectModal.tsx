'use client';

import { useEffect } from 'react';
import clsx from 'clsx';

/**
 * v2.20-1 — "Sign-in coming soon" modal for the Header's Connect button.
 *
 * Through v2.19 the Connect button was a bright volt CTA with no onClick —
 * the same dead-button state the Hero CTAs were in pre-v2.17. Evaluators
 * clicked, nothing happened, confusion followed. We can't actually wire
 * SSO/wallet this cycle (it's a backend concern), so the modal sets
 * expectations up front and previews the MVP+1 surface:
 *
 *   - SSO (Google / Apple / email) for discover + positions sync
 *   - Wallet connect (WalletConnect v2, Kakao Wallet, Naver Wallet) for
 *     on-chain HOGC oracle settlement
 *
 * Both planned items appear as pill chips with a "Coming soon" tag so
 * the modal is honest rather than bait-and-switch. Primary CTA is
 * "Notify me" (a mailto: — cheapest way to collect demand without a
 * backend), secondary is "Keep exploring" which closes the modal.
 */
interface Props {
  open: boolean;
  onClose: () => void;
}

export function ConnectModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={clsx(
        'fixed inset-0 z-[60] flex items-end justify-center px-4 pb-4 transition sm:items-center sm:p-4 w-[100dvw] h-[100dvh]',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-modal-title"
      aria-hidden={!open}
    >
      <div
        className={clsx(
          'absolute inset-0 bg-ink-900/70 backdrop-blur-sm transition-opacity duration-300 w-full h-full',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'relative w-full max-w-md overflow-hidden rounded-3xl border border-volt/20 bg-gradient-to-br from-ink-800 via-ink-800 to-ink-900 p-6 shadow-2xl transition-all duration-300 md:p-7',
          open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-900 text-bone-muted hover:text-bone"
        >
          ✕
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-widest text-volt">
          ✨ Roadmap · Sign-in
        </div>
        <h2
          id="connect-modal-title"
          className="mt-2 font-display text-2xl leading-tight text-bone md:text-3xl"
        >
          Sign-in + wallet · coming soon
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-bone-muted">
          Conviction in beta is view-only + local-state positions. Sign-in
          ships in the next cut — SSO to sync your trades across devices,
          wallet connect for on-chain settlement via the HOGC oracle.
        </p>

        <div className="mt-5 space-y-2">
          <RoadmapRow
            icon="🔐"
            title="SSO · Google, Apple, email"
            body="Sync positions + parlay tickets across devices. No wallet required to browse."
          />
          <RoadmapRow
            icon="💳"
            title="Wallet connect"
            body="WalletConnect v2 · Kakao Wallet · Naver Wallet. Required only for on-chain settlement."
          />
          <RoadmapRow
            icon="🏛️"
            title="HOGC oracle · on-chain resolve"
            body="Tickets settle against the 23-source AI verdict, posted on-chain for provable fills."
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href="mailto:beta@conviction.trade?subject=Notify%20me%20when%20sign-in%20ships"
            className="flex-1 rounded-full bg-gradient-to-r from-volt to-volt-dark py-3 text-center text-sm font-bold text-ink-900 hover:brightness-105"
          >
            Notify me
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-white/10 bg-ink-900 py-3 text-center text-sm font-semibold text-bone hover:bg-ink-700"
          >
            Keep exploring
          </button>
        </div>
      </div>
    </div>
  );
}

function RoadmapRow({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-ink-900 p-3">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-base"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-bone">
            {title}
          </span>
          <span className="shrink-0 rounded-full border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-bone-muted">
            Soon
          </span>
        </div>
        <div className="mt-0.5 text-xs leading-relaxed text-bone-muted">
          {body}
        </div>
      </div>
    </div>
  );
}
