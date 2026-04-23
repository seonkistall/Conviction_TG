'use client';

import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import clsx from 'clsx';
import { MARKETS, TRADERS, NARRATIVE_INDICES } from '@/lib/markets';
import type { Market } from '@/lib/types';

/**
 * Global ⌘K search palette.
 *
 * Design notes
 * ------------
 *  - **Substring match, no fuse.js.** The fixture set is ~40 items total
 *    (markets + traders + narratives + static nav routes). A lowercased
 *    `includes()` across title/tags/category/handle returns results in
 *    <0.1ms and ships zero KB of third-party code.
 *  - **Keyboard-first UX.** ↑/↓ to move selection, Enter to navigate,
 *    Esc to close, `/` also opens (for users who don't know ⌘K). We
 *    trap focus inside the input and keep results clickable with a
 *    mouse for the on-camera demo.
 *  - **Sectioned results.** Markets / Traders / Narratives / Pages in
 *    fixed order. Each group caps at 6 so the list never scrolls past
 *    the viewport on laptop screens.
 *  - **Ranked.** Exact-title matches rank above tag/category matches.
 *    Trending markets get a small tiebreaker bump so the results feel
 *    alive on an empty query.
 */

interface Hit {
  kind: 'market' | 'trader' | 'narrative' | 'page';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
}

const STATIC_PAGES: { title: string; subtitle: string; href: string }[] = [
  { title: 'Feed', subtitle: 'Vertical shorts of live markets', href: '/feed' },
  { title: 'Leaderboard', subtitle: 'Top traders · 30d', href: '/leaderboard' },
  { title: 'Portfolio', subtitle: 'Your positions and P&L', href: '/portfolio' },
  { title: 'Methodology', subtitle: 'How the AI oracle grades', href: '/methodology' },
  { title: 'Worlds 2026', subtitle: 'LoL championship hub', href: '/worlds-2026' },
  { title: 'Create a market', subtitle: 'Spawn with the AI wizard', href: '/markets/new' },
];

/**
 * Normalize for substring matching.
 *
 * v2.13: Markets and narrative titles include Korean (e.g. "LPL Rising ·
 * 중국 리그 제국", trader options labels with 한글 aliases). Hangul
 * pasted from some sources arrives in decomposed form (NFD) — those code
 * points won't substring-match the precomposed (NFC) form even though they
 * look identical. We normalize BOTH the haystack and the needle to NFC,
 * then collapse runs of whitespace so "한국  대선" matches "한국 대선".
 *
 * Latin lowercasing is preserved (`toLocaleLowerCase` is unicode-safe and
 * matches the previous behaviour for ASCII queries).
 */
function norm(s: string): string {
  return s.normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreMatch(text: string, q: string): number {
  // -1 = no match. 0+ = match, lower-is-better.
  if (!q) return 0;
  const t = norm(text);
  const needle = norm(q);
  if (!needle) return 0;
  const idx = t.indexOf(needle);
  if (idx < 0) return -1;
  // Starting at position 0 is the best. Whole-word matches outrank mid-word.
  if (idx === 0) return 0;
  if (/\s/.test(t.charAt(idx - 1))) return 1;
  return 2 + idx / 100;
}

function matchMarket(m: Market, q: string): number {
  const title = scoreMatch(m.title, q);
  const cat = scoreMatch(m.category, q);
  const tags = m.tags.reduce(
    (best, tag) => {
      const s = scoreMatch(tag, q);
      return s >= 0 && (best < 0 || s < best) ? s : best;
    },
    -1 as number
  );
  const best = [title, cat, tags].filter((x) => x >= 0);
  if (best.length === 0) return -1;
  const min = Math.min(...best);
  // Trending markets get a small bump (subtract 0.1 so a trending
  // mid-word match can beat a non-trending mid-word match).
  return m.trending ? min - 0.1 : min;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // ⌘K / Ctrl+K / `/` toggles. Ignore `/` when focus is in a text field
  // (search bars on other screens, etc.) so we don't steal their typing.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === '/' && !open) {
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName;
        const editable =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          (t as HTMLElement)?.isContentEditable;
        if (editable) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /*
   * v2.20-4: Pre-seed the palette query from external callers.
   *
   * Other components (VibeMeter cards for now, could be more later)
   * hand the user into search by dispatching a `cv:palette:seed`
   * custom event with the intended query, then firing the synthetic
   * ⌘K keydown. We latch the seed here and apply it on the next
   * open — if the event arrives BEFORE the keydown, the seed waits;
   * if it arrives during an already-open palette, we apply right
   * away.
   *
   * Using a custom event (not a shared context) keeps the palette
   * agnostic about what "other components" exist — any client
   * surface can seed the palette without importing a hook.
   */
  const seedRef = useRef<string>('');
  useEffect(() => {
    const onSeed = (e: Event) => {
      const ce = e as CustomEvent<string>;
      if (typeof ce.detail !== 'string') return;
      if (open) {
        setQuery(ce.detail);
      } else {
        seedRef.current = ce.detail;
      }
    };
    window.addEventListener('cv:palette:seed', onSeed);
    return () => window.removeEventListener('cv:palette:seed', onSeed);
  }, [open]);

  // Focus the input + apply any pending seed whenever we open.
  useEffect(() => {
    if (!open) return;
    setQuery(seedRef.current);
    seedRef.current = '';
    setSel(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    const out: Hit[] = [];

    // Markets
    const marketHits: Hit[] = [];
    for (const m of MARKETS) {
      if (m.status === 'resolved' && q === '') continue;
      const s = matchMarket(m, q);
      if (s < 0 && q) continue;
      marketHits.push({
        kind: 'market',
        id: m.id,
        title: m.title,
        subtitle: `${m.category} · ${Math.round(m.yesProb * 100)}¢ · ${m.traders.toLocaleString()} traders`,
        href: `/markets/${m.slug}`,
        score: q ? s : m.trending ? 0 : 1,
      });
    }
    marketHits.sort((a, b) => a.score - b.score);
    out.push(...marketHits.slice(0, 6));

    // Traders
    const traderHits: Hit[] = [];
    for (const tr of TRADERS) {
      const s = q
        ? Math.min(
            ...(
              [scoreMatch(tr.handle, q), scoreMatch(tr.region, q)].filter(
                (x) => x >= 0
              ) as number[]
            ).concat([9999])
          )
        : 0;
      if (q && s === 9999) continue;
      traderHits.push({
        kind: 'trader',
        id: tr.id,
        title: `@${tr.handle}`,
        subtitle: `${tr.region} · ${Math.round(tr.winRate * 100)}% win · $${(tr.pnl30d / 1000).toFixed(1)}k`,
        href: `/traders/${tr.handle}`,
        score: s,
      });
    }
    traderHits.sort((a, b) => a.score - b.score);
    out.push(...traderHits.slice(0, 4));

    // Narratives
    const narrativeHits: Hit[] = [];
    for (const n of NARRATIVE_INDICES) {
      const s = q
        ? Math.min(
            ...([scoreMatch(n.title, q), scoreMatch(n.blurb, q)].filter(
              (x) => x >= 0
            ) as number[]).concat([9999])
          )
        : 0;
      if (q && s === 9999) continue;
      narrativeHits.push({
        kind: 'narrative',
        id: n.id,
        title: `${n.emoji} ${n.title}`,
        subtitle: n.blurb,
        href: `/narratives/${n.slug}`,
        score: s,
      });
    }
    narrativeHits.sort((a, b) => a.score - b.score);
    out.push(...narrativeHits.slice(0, 4));

    // Static pages — always available, matched or not (with empty query).
    const pageHits: Hit[] = [];
    for (const p of STATIC_PAGES) {
      const s = q
        ? Math.min(
            ...([scoreMatch(p.title, q), scoreMatch(p.subtitle, q)].filter(
              (x) => x >= 0
            ) as number[]).concat([9999])
          )
        : 0;
      if (q && s === 9999) continue;
      pageHits.push({
        kind: 'page',
        id: p.href,
        title: p.title,
        subtitle: p.subtitle,
        href: p.href,
        score: s,
      });
    }
    pageHits.sort((a, b) => a.score - b.score);
    out.push(...pageHits.slice(0, 6));

    return out;
  }, [query]);

  // Clamp selection when results change.
  useEffect(() => {
    setSel((s) => (s >= hits.length ? Math.max(0, hits.length - 1) : s));
  }, [hits.length]);

  const go = useCallback(
    (hit: Hit) => {
      setOpen(false);
      router.push(hit.href);
    },
    [router]
  );

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(hits.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const h = hits[sel];
      if (h) go(h);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  if (!open) return null;

  // Group for rendering — preserves the order we pushed them in above.
  const groups: { label: string; items: Hit[] }[] = [
    { label: 'Markets', items: hits.filter((h) => h.kind === 'market') },
    { label: 'Traders', items: hits.filter((h) => h.kind === 'trader') },
    { label: 'Narratives', items: hits.filter((h) => h.kind === 'narrative') },
    { label: 'Pages', items: hits.filter((h) => h.kind === 'page') },
  ].filter((g) => g.items.length > 0);

  let runningIdx = 0;

  return (
    <div
      role="dialog"
      aria-label="Command palette"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-ink-900/70 p-4 pt-[10vh] backdrop-blur"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 text-bone-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search markets, traders, narratives…"
            className="flex-1 bg-transparent text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none"
            // v2.16: Distinct from CategoryTabs' "Search markets" so screen
            // readers and our smoke selectors can tell the two apart.
            aria-label="Command palette search"
            aria-controls="cmdk-list"
            aria-activedescendant={
              hits[sel] ? `cmdk-item-${sel}` : undefined
            }
          />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-bone-muted">
            Esc
          </kbd>
        </div>

        <ul
          ref={listRef}
          id="cmdk-list"
          role="listbox"
          className="max-h-[55vh] overflow-y-auto py-2"
        >
          {groups.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-bone-muted">
              No matches.
            </li>
          )}
          {groups.map((g) => (
            <li key={g.label} className="mb-1">
              <div className="px-4 pt-2 text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
                {g.label}
              </div>
              <ul>
                {g.items.map((h) => {
                  const idx = runningIdx++;
                  const active = idx === sel;
                  return (
                    <li
                      key={h.id}
                      id={`cmdk-item-${idx}`}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setSel(idx)}
                      onClick={() => go(h)}
                      className={clsx(
                        'flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm',
                        active ? 'bg-white/5 text-bone' : 'text-bone-muted hover:bg-white/5'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-bone">{h.title}</div>
                        <div className="truncate text-[11px] text-bone-muted">
                          {h.subtitle}
                        </div>
                      </div>
                      <span className="ml-3 rounded border border-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-bone-muted">
                        {h.kind === 'market'
                          ? 'market'
                          : h.kind === 'trader'
                          ? 'trader'
                          : h.kind === 'narrative'
                          ? 'index'
                          : 'page'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[11px] text-bone-muted">
          <div className="flex items-center gap-2">
            <Legend k="↑↓" l="Navigate" />
            <Legend k="↵" l="Open" />
            <Legend k="Esc" l="Close" />
          </div>
          <div className="hidden sm:block">
            Press <kbd className="rounded border border-white/10 px-1 text-[10px]">⌘ K</kbd> any time
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend({ k, l }: { k: string; l: string }) {
  return (
    <span className="flex items-center gap-1">
      <kbd className="rounded border border-white/10 px-1 py-0.5 text-[10px]">{k}</kbd>
      <span>{l}</span>
    </span>
  );
}
