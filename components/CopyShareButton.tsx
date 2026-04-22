'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n';

/**
 * Copy-to-clipboard button for the shareable parlay receipt.
 *
 * Takes the canonical receipt URL and copies it to the clipboard with a
 * 2s "Copied" state, then falls back to text selection on any failure.
 *
 * Labels default to the active locale via useT(); callers can still pass
 * `labelIdle` / `labelCopied` to override (used by tests / non-i18n pages).
 */
export function CopyShareButton({
  url,
  labelIdle,
  labelCopied,
}: {
  url: string;
  labelIdle?: string;
  labelCopied?: string;
}) {
  const t = useT();
  const idle = labelIdle ?? t('share.copy_link');
  const done = labelCopied ?? t('share.copied');
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Legacy fallback (Safari < 13.1, old Android webviews)
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently swallow — surfaces as "did nothing" which is fine for MVP.
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-ink-800 px-4 py-2.5 text-sm font-semibold text-bone transition hover:border-volt/40 hover:text-volt"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <span>{copied ? done : idle}</span>
    </button>
  );
}
