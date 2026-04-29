'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { useT } from '@/lib/i18n';

type Phase = 'idle' | 'parse' | 'route' | 'scrape' | 'judge' | 'verify' | 'publish' | 'done';

const PHASES: Phase[] = ['parse', 'route', 'scrape', 'judge', 'verify', 'publish'];

const SAMPLE_QS = [
  'BLACKPINK tops Spotify Global chart in Q4 2026?',
  'Will aespa announce an LA tour before Oct 2026?',
  'Kiwoom beat Doosan in the 2026 KBO final?',
  'Does HYBE hit ₩300B H1 26 operating profit?',
];

const SCRAPERS = [
  { name: 'Brave Search', tone: 'text-[#FB542B]' },
  { name: 'Exa Neural', tone: 'text-conviction' },
  { name: 'Naver News', tone: 'text-[#03C75A]' },
  { name: 'Weverse', tone: 'text-[#FF8AB4]' },
  { name: 'Instiz', tone: 'text-bone' },
  { name: 'CoinGecko', tone: 'text-[#8DC647]' },
  { name: 'TheSportsDB', tone: 'text-volt' },
  { name: 'YouTube Data', tone: 'text-[#FF0000]' },
  { name: 'Reddit', tone: 'text-[#FF4500]' },
  { name: 'X (Twitter)', tone: 'text-bone' },
  { name: 'KOSPI OpenAPI', tone: 'text-[#009CA6]' },
  { name: 'BOJ Rates', tone: 'text-[#E60012]' },
  { name: 'Domain RAG · Chroma', tone: 'text-conviction' },
];

export function NewMarketClient() {
  const t = useT();
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const timerRef = useRef<number | null>(null);

  // v2.20-3: Pre-fill from ?q=… so deep-link entries (DebutCalendar's
  // "Spawn market for {artist}" CTA, future share-a-question URLs) hand
  // the question straight into the textarea instead of making the user
  // retype it. Unwrap on mount only; subsequent edits stay controlled
  // by the user.
  useEffect(() => {
    const seed = searchParams?.get('q');
    if (seed && !q) setQ(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * v2.21-5 — Placeholder cycling.
   *
   * When the textarea is empty AND the user hasn't started the
   * pipeline yet, rotate the placeholder through SAMPLE_QS every 3s
   * so the empty state tells a story instead of showing a static
   * "e.g. ..." hint. Pauses the moment the user types (phase !==
   * 'idle' || q.trim()) so it never flashes under their caret.
   */
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    if (phase !== 'idle' || q.trim().length > 0) return;
    const t = setInterval(() => {
      setPlaceholderIdx((x) => (x + 1) % SAMPLE_QS.length);
    }, 3000);
    return () => clearInterval(t);
  }, [phase, q]);
  const activePlaceholder = SAMPLE_QS[placeholderIdx];

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function run() {
    if (!q.trim()) return;
    const next = (p: Phase, delay: number) => {
      timerRef.current = window.setTimeout(() => setPhase(p), delay) as unknown as number;
    };
    setPhase('parse');
    next('route', 800);
    next('scrape', 1800);
    next('judge', 3600);
    next('verify', 5200);
    next('publish', 6400);
    next('done', 7400);
  }

  const phaseIndex = useMemo(() => {
    if (phase === 'idle') return -1;
    if (phase === 'done') return PHASES.length;
    return PHASES.indexOf(phase);
  }, [phase]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-conviction/30 bg-conviction/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-conviction">
            <span className="live-dot" style={{ background: '#7C5CFF' }} /> Agent Pipeline · v2
          </div>
          <h1 className="display-xl mt-3 text-5xl text-bone md:text-7xl">
            {t('newmkt.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-bone-muted">{t('newmkt.sub')}</p>
        </div>
      </div>

      {/*
       * v2.21-5 — Input card.
       *
       * Polish pass:
       *   - Placeholder cycles through SAMPLE_QS every 3s when empty
       *     (see placeholderIdx effect above). key={activePlaceholder}
       *     triggers a brief fade so each new example feels intentional
       *     rather than a typo-flicker.
       *   - Submit button adds active:scale-[0.98] for tactile press
       *     feedback, matches the Hero / PermissionlessSection CTA
       *     pattern.
       *   - New 1-line caption below the textarea sets expectations
       *     and advertises APAC-language support — a first-time
       *     evaluator wouldn't otherwise know they can type "블랙핑크
       *     4인 앨범 2026?" directly.
       */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-ink-800 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="mt-2 hidden h-8 w-8 items-center justify-center rounded-md bg-volt text-sm font-bold text-ink-900 sm:flex">
            ?
          </span>
          <textarea
            key={activePlaceholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              phase === 'idle' && !q.trim()
                ? activePlaceholder
                : t('newmkt.placeholder')
            }
            rows={2}
            className="min-w-0 flex-1 resize-none bg-transparent text-xl leading-tight text-bone transition-opacity duration-500 placeholder:text-bone-muted/60 focus:outline-none sm:text-2xl md:text-3xl"
            disabled={phase !== 'idle' && phase !== 'done'}
          />
        </div>
        <div className="mt-3 sm:pl-11">
          <button
            type="button"
            onClick={run}
            disabled={!q.trim() || (phase !== 'idle' && phase !== 'done')}
            className={clsx(
              'w-full rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98] sm:w-auto',
              q.trim() && (phase === 'idle' || phase === 'done')
                ? 'bg-gradient-to-r from-volt to-volt-dark text-ink-900 shadow-xl hover:brightness-105'
                : 'bg-ink-900 text-bone-muted'
            )}
          >
            {t('newmkt.propose')} →
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[11px] text-bone-muted sm:pl-11">
          <span aria-hidden="true" className="text-conviction">✨</span>
          Type in English, 한국어, 日本語, or 中文. AI routes to the
          matching domain stack.
        </div>

        {phase === 'idle' && (
          <div className="mt-4 flex flex-wrap gap-2 sm:pl-11">
            {SAMPLE_QS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQ(s)}
                className="rounded-full border border-white/10 bg-ink-900 px-3 py-1.5 text-[11px] text-bone-muted transition active:scale-95 hover:border-white/20 hover:text-bone"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline */}
      {phase !== 'idle' && (
        <div className="mt-8 grid gap-6 md:grid-cols-5">
          {/* Phase stepper */}
          <aside className="md:col-span-2">
            <ol className="space-y-2">
              {PHASES.map((p, i) => (
                <li
                  key={p}
                  className={clsx(
                    'flex items-start gap-3 rounded-xl border px-4 py-3 transition',
                    i < phaseIndex
                      ? 'border-volt/20 bg-volt/5'
                      : i === phaseIndex
                      ? 'border-volt bg-volt/10 shadow-[0_0_0_1px_rgba(198,255,61,0.2)]'
                      : 'border-white/10 bg-ink-800 opacity-60'
                  )}
                >
                  <span
                    className={clsx(
                      'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]',
                      i < phaseIndex
                        ? 'bg-volt text-ink-900'
                        : i === phaseIndex
                        ? 'bg-volt text-ink-900'
                        : 'bg-ink-900 text-bone-muted'
                    )}
                  >
                    {i < phaseIndex ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-bone-muted">
                      {t(`newmkt.step.${p}`)}
                    </div>
                    {i === phaseIndex && (
                      <div className="relative mt-2 h-1 overflow-hidden rounded-full bg-ink-900">
                        <span className="scanline" />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          {/* Right panel. key={phase} triggers a fade-in each time the
              pipeline advances — Apple/Toss-style transition feel. */}
          <div className="md:col-span-3">
            <div
              key={phase}
              className="animate-fade-in-up rounded-2xl border border-white/10 bg-ink-800 p-5"
            >
              {phase === 'parse' && <Parse q={q} />}
              {phase === 'route' && <Route />}
              {phase === 'scrape' && <Scrape />}
              {phase === 'judge' && <Judge q={q} />}
              {phase === 'verify' && <Verify />}
              {phase === 'publish' && <Publish />}
              {phase === 'done' && <Done q={q} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Parse({ q }: { q: string }) {
  return (
    <div>
      <Mono tag="Intent Parser" />
      <p className="mt-3 text-sm text-bone">{q}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <Kv k="domain" v="K-Pop · HYBE" />
        <Kv k="entities" v="BLACKPINK, YG" />
        <Kv k="horizon" v="Q4 2026" />
        <Kv k="kind" v="binary" />
        <Kv k="region" v="KR · GLOBAL" />
        <Kv k="polarity" v="YES-oriented" />
      </div>
    </div>
  );
}

function Route() {
  return (
    <div>
      <Mono tag="Domain Router" />
      <p className="mt-3 text-sm text-bone">
        → <span className="text-volt">stack.kpop.v3</span> (agency IR + Weverse + Naver)
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-ink-900 p-3 text-[11px] text-bone-muted">
{`route {
  stack: "kpop.v3",
  scrapers: 13,
  rag: "chroma/kpop",
  priors: {"hybe.h2.activity": 0.84}
}`}
      </pre>
    </div>
  );
}

function Scrape() {
  return (
    <div>
      <Mono tag="ResearchSwarm · 23 scrapers" />
      <ul className="mt-3 space-y-1.5">
        {SCRAPERS.map((s, i) => (
          <li
            key={s.name}
            className="flex items-center justify-between rounded-md border border-white/5 bg-ink-900 px-3 py-1.5 text-[12px]"
            style={{ opacity: 1 - i * 0.04 }}
          >
            <span className={s.tone}>● {s.name}</span>
            <span className="font-mono text-[11px] text-bone-muted">
              {Math.floor(6 + Math.random() * 42)} hits
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Judge({ q }: { q: string }) {
  return (
    <div>
      <Mono tag="Qwen3-32B · drafting verdict" />
      <div className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-bone-muted">
        <div className="text-bone">
          → Weighted base-rate from n=17 K-pop comebacks: 0.68
        </div>
        <div>→ Weverse anticipation spike: +38% MoM</div>
        <div>→ Agency IR signal: "group activity within FY"</div>
        <div>→ Counter-signal (stock leak): -0.04</div>
        <div className="text-volt">→ Draft verdict: YES · confidence 0.78</div>
      </div>
    </div>
  );
}

function Verify() {
  return (
    <div>
      <Mono tag="Sonnet-4.6 · verifying" />
      <div className="mt-3 text-[12px] leading-relaxed text-bone">
        Cross-checked Qwen3 draft against 4 independent source-chains.
        Flagged 1 low-confidence source (removed). Verdict <span className="text-volt font-mono">YES · 0.78</span> stands.
      </div>
      <div className="mt-3 text-[11px] text-bone-muted">
        ✓ Domain sanity check · ✓ Source diversity · ✓ No contradicting signal
      </div>
    </div>
  );
}

function Publish() {
  return (
    <div>
      <Mono tag="Publishing to HOGC oracle · wallet.seoul.eth" />
      <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-ink-900 p-3 text-[11px] text-bone-muted">
{`tx  0x4a9c…d8e1
block  #18,944,281
gas  42,108 · 8 gwei
status  ⏳ signing…`}
      </pre>
    </div>
  );
}

function Done({ q }: { q: string }) {
  return (
    <div>
      <Mono tag="✓ Market live · on-chain" tone="text-yes" />
      <h3 className="mt-3 font-display text-2xl text-bone">{q}</h3>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Kv k="Yes price" v="¢62" />
        <Kv k="AI conf." v="78%" />
        <Kv k="Edge" v="+16 pp" />
      </div>
      {/*
       * v2.21-5 — Wired CTAs.
       *
       * Pre-v2.21 the Done state showed two decorative buttons with no
       * onClick — the flagship "look, the market just shipped"
       * moment for a VC demo ended in a dead CTA. Since we don't
       * actually persist the proposed market in localStorage yet, we
       * deep-link "Trade market →" to the BLACKPINK binary (the
       * closest analog in the MARKETS catalog: K-pop, binary, live,
       * similar confidence range) with `?side=yes` so the intent
       * carries through v2.17-1's Hero-CTA pattern. Share copies the
       * question text to clipboard — the cheapest real share without
       * a proposer identity yet.
       */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/markets/blackpink-reunion-2026?side=yes"
          className="rounded-full bg-gradient-to-r from-volt to-volt-dark px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-xl transition active:scale-[0.98] hover:brightness-105"
        >
          Trade market →
        </Link>
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
              navigator.clipboard.writeText(q).catch(() => {});
            }
          }}
          className="rounded-full border border-white/10 bg-ink-900 px-4 py-2.5 text-sm font-semibold text-bone transition active:scale-[0.98] hover:bg-ink-700"
        >
          Copy question
        </button>
      </div>
      <div className="mt-3 text-[11px] text-bone-muted">
        Next step in prod: wallet-connect signs the market draft → HOGC
        oracle persists on-chain → market appears in everyone's feed.
      </div>
    </div>
  );
}

function Mono({ tag, tone = 'text-volt' }: { tag: string; tone?: string }) {
  return (
    <div className={`font-mono text-[11px] font-semibold uppercase tracking-widest ${tone}`}>
      {tag}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 p-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-bone-muted">
        {k}
      </div>
      <div className="mt-1 font-mono text-sm font-bold text-bone">{v}</div>
    </div>
  );
}
