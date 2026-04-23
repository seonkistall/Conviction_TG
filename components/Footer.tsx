import Link from 'next/link';

type FooterItem = {
  label: string;
  href?: string;
  external?: boolean;
  muted?: boolean;
};

/**
 * v2.22-5 — Footer rewrite.
 *
 * Pre-v2.22 the Markets column listed 6 hard-coded categories
 * ("K-Pop / K-Drama / Esports / Sports / Crypto / Politics") which
 * (a) skewed K-heavy to match the old moat framing and
 * (b) had no hrefs — every label was dead text. Platform + Community
 * were similarly a mix of working and not-working links.
 *
 * Three columns now, all with real href targets:
 *   - Markets: the primary discovery surfaces ordered by APAC
 *     region (Korea → Japan → China → India → SEA → Macro). Category
 *     discovery page doesn't exist yet, so the non-route-level rows
 *     deep-link to the landing page with a hash so the reader lands
 *     on the in-page catalog section.
 *   - Platform: product surfaces that actually ship — Feed, Propose,
 *     Methodology, Oracle trust signals, status chip.
 *   - Community: real handles where they exist, "Soon" muted chips
 *     where we haven't set up a presence. Honest rather than blue
 *     text that 404s.
 */
const MARKETS_ITEMS: FooterItem[] = [
  { label: 'All markets', href: '/' },
  { label: '🇰🇷 Korea', href: '/#permissionless' },
  { label: '🇯🇵 Japan', href: '/#permissionless' },
  { label: '🇨🇳 China', href: '/#permissionless' },
  { label: '🇮🇳 India', href: '/#permissionless' },
  { label: '🌏 SEA', href: '/#permissionless' },
  { label: 'Macro · Crypto', href: '/#permissionless' },
];

const PLATFORM_ITEMS: FooterItem[] = [
  { label: 'Feed', href: '/feed' },
  { label: 'Propose a market', href: '/markets/new' },
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'AI Oracle', href: '/methodology' },
  { label: 'Methodology', href: '/methodology' },
  { label: 'Status', muted: true },
];

const COMMUNITY_ITEMS: FooterItem[] = [
  {
    label: 'X · @conviction_apac',
    href: 'https://x.com/intent/follow?screen_name=conviction_apac',
    external: true,
  },
  { label: 'Discord', muted: true },
  { label: 'Telegram', muted: true },
  { label: 'Paradigm', muted: true },
  { label: 'Blog', muted: true },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/5 bg-ink-900 px-6 py-12">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-10 md:grid-cols-5">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-volt text-ink-900">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L22 20 H2 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-2xl tracking-tightest">Conviction</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-bone-muted">
            The APAC-native, AI-powered prediction market. K-pop comebacks,
            LCK · LPL, NPB, Bollywood, anime, macro — every APAC narrative,
            one liquid venue.
          </p>
          <p className="mt-8 text-xs text-bone-muted/60">
            © 2026 Conviction Labs. Markets resolve via a 23-source AI
            evidence swarm + human oracle review.
          </p>
        </div>
        <FooterColumn title="Markets" items={MARKETS_ITEMS} />
        <FooterColumn title="Platform" items={PLATFORM_ITEMS} />
        <FooterColumn title="Community" items={COMMUNITY_ITEMS} />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: FooterItem[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-bone-muted">
        {title}
      </h4>
      <ul className="space-y-2 text-sm text-bone">
        {items.map((i) => (
          <li key={i.label} className="flex items-center gap-1.5">
            {i.href ? (
              <Link
                href={i.href}
                {...(i.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="transition-colors hover:text-volt"
              >
                {i.label}
              </Link>
            ) : (
              <span
                className={
                  i.muted
                    ? 'cursor-default text-bone-muted'
                    : 'cursor-pointer hover:text-volt'
                }
              >
                {i.label}
              </span>
            )}
            {/* v2.22-5: explicit "Soon" chip for community channels we
                haven't set up yet — avoids the old dead-link text
                pretending to be clickable. */}
            {i.muted && (
              <span className="rounded-full border border-white/10 bg-ink-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-bone-muted/80">
                Soon
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
