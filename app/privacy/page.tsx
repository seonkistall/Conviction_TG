import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy · Conviction',
  description: 'Conviction Privacy Policy (beta)',
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-bone">
      <h1 className="font-display text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-bone-muted">Effective 2026-05-01 · Beta release</p>

      <div className="mt-10 space-y-6 leading-relaxed text-bone-muted">
        <p>
          We collect the minimum needed to run a Telegram Mini App and
          settle bets on TON. We do not sell user data.
        </p>

        <h2 className="font-display text-2xl text-bone">What we collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <span className="text-bone">Telegram initData</span> — id,
            language code, premium status. Hashed by Telegram so we can
            verify the session was launched from the official client.
          </li>
          <li>
            <span className="text-bone">On-chain bet history</span> — the
            transactions you sign through TON Connect. These are public
            on the TON blockchain regardless of Conviction.
          </li>
          <li>
            <span className="text-bone">Aggregate analytics</span> —
            page views and performance via Vercel Analytics + Speed
            Insights. No personally-identifying data leaves our control.
          </li>
        </ul>

        <h2 className="font-display text-2xl text-bone">What we do NOT collect</h2>
        <ul className="list-disc space-y-2 pl-6">
          <li>Email addresses (unless you mail beta@conviction.bet voluntarily).</li>
          <li>Passwords (we have no password auth).</li>
          <li>Wallet seeds, private keys, or recovery phrases.</li>
        </ul>

        <h2 className="font-display text-2xl text-bone">Retention</h2>
        <p>
          Session data is held only as long as needed to run the active
          Mini App session. Aggregate analytics are retained per
          Vercel's defaults (30 days for raw, longer for rollups).
        </p>

        <h2 className="font-display text-2xl text-bone">Contact</h2>
        <p>
          Privacy questions: <a className="text-volt underline" href="mailto:privacy@conviction.bet">privacy@conviction.bet</a>
        </p>
      </div>
    </main>
  );
}
