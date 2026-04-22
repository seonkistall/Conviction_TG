import Link from 'next/link';

type FooterItem = { label: string; href?: string };

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
            The first Asia-native, AI-powered prediction market. Every APAC narrative,
            one liquid venue.
          </p>
          <p className="mt-8 text-xs text-bone-muted/60">
            © 2026 Conviction Labs. All markets resolve via AI evidence-swarm + human oracle.
          </p>
        </div>
        <FooterColumn
          title="Markets"
          items={[
            { label: 'K-Pop' },
            { label: 'K-Drama' },
            { label: 'Esports' },
            { label: 'Sports' },
            { label: 'Crypto' },
            { label: 'Politics' },
          ]}
        />
        <FooterColumn
          title="Platform"
          items={[
            { label: 'API' },
            { label: 'Docs' },
            { label: 'AI Oracle', href: '/methodology' },
            { label: 'Methodology', href: '/methodology' },
            { label: 'HOGC' },
            { label: 'Status' },
          ]}
        />
        <FooterColumn
          title="Community"
          items={[
            { label: 'Twitter' },
            { label: 'Discord' },
            { label: 'Telegram' },
            { label: 'Paradigm' },
            { label: 'Blog' },
          ]}
        />
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
          <li key={i.label}>
            {i.href ? (
              <Link
                href={i.href}
                className="transition-colors hover:text-volt"
              >
                {i.label}
              </Link>
            ) : (
              <span className="cursor-pointer hover:text-volt">{i.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
