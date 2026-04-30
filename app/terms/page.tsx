import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use · Conviction',
  description: 'Conviction Terms of Use (beta)',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-bone">
      <h1 className="font-display text-4xl">Terms of Use</h1>
      <p className="mt-2 text-sm text-bone-muted">Effective 2026-05-01 · Beta release</p>

      <div className="mt-10 space-y-6 leading-relaxed text-bone-muted">
        <p>
          Conviction is in public beta. By using the Mini App you agree
          to these terms. We will keep this page short and update it as
          the product matures; substantive changes will be announced
          via Telegram.
        </p>

        <h2 className="font-display text-2xl text-bone">Beta scope</h2>
        <p>
          The Conviction Mini App is provided as-is, on a best-effort
          basis, without warranties of any kind. Markets shown during
          beta may use simulated data, and resolutions during beta are
          informational. Real-money settlement is enabled progressively
          as TON Connect and AI Oracle infrastructure cleared
          regulatory review per jurisdiction.
        </p>

        <h2 className="font-display text-2xl text-bone">Eligibility</h2>
        <p>
          You must be of legal age in your jurisdiction to use
          Conviction. Some jurisdictions restrict prediction markets
          entirely; you are responsible for confirming local
          permissibility before participating.
        </p>

        <h2 className="font-display text-2xl text-bone">Wallet & funds</h2>
        <p>
          Conviction does not custody user funds. All bets are
          settled on-chain via TON Connect. We do not have access to
          your wallet seed and cannot recover funds sent in error.
        </p>

        <h2 className="font-display text-2xl text-bone">Data</h2>
        <p>
          Telegram identity (initData) is used solely to authenticate
          your session. We do not sell user data. See the{' '}
          <a className="text-volt underline" href="/privacy">privacy policy</a>.
        </p>

        <h2 className="font-display text-2xl text-bone">Contact</h2>
        <p>
          Questions: <a className="text-volt underline" href="mailto:beta@conviction.bet">beta@conviction.bet</a>
        </p>
      </div>
    </main>
  );
}
