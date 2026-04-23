import Link from 'next/link';

/**
 * v2.21-4 — Permissionless market creation as a landing-page moat.
 *
 * Through v2.20 the only landing surface for Conviction's "anyone
 * proposes, AI verifies" story was the Hero's body copy. For a
 * Tier-1 VC demo we want this to read as a full moat block, parallel
 * to Narrative Indices / Agentic Traders / Vibe Meter / Debut
 * Calendar — a 5th pillar on the Asia-native moat ladder.
 *
 * Layout mirrors the other moats (eyebrow pill + display headline +
 * body + 3-up feature row + CTAs). Copy is grounded in the actual
 * pipeline that already exists on /markets/new — no marketing fluff
 * disconnected from the product.
 */
export function PermissionlessSection() {
  return (
    <section
      id="permissionless"
      className="mx-auto max-w-[1440px] px-6 pt-12 sm:pt-16"
    >
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-conviction/40 bg-conviction/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-conviction">
          ✨ Permissionless · Conviction AI
        </div>
        <h2 className="mt-3 font-display text-3xl text-bone sm:text-4xl md:text-5xl">
          Anyone proposes.
          <br className="hidden sm:inline" />{' '}
          <span className="italic text-volt">AI verifies. Markets go live.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-bone-muted md:text-base">
          Type a question in plain English or Korean. Conviction's
          23-scraper swarm pulls APAC-native evidence, Qwen3-32B drafts
          a verdict, Sonnet-4.6 verifies it against calibration history.
          If confidence clears the threshold, the market ships with a
          signed oracle trail — no moderator queue, no waiting room.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PillarCard
          step="01"
          title="Type the thesis"
          body="Natural language, any APAC language. Intent + entity + horizon parsed in one pass — no market-maker forms."
          example='"Will YOASOBI chart Billboard top 40 this year?"'
        />
        <PillarCard
          step="02"
          title="23 sources fan out"
          body="Brave · Exa · Naver · Weverse · Weibo · Niconico · CoinGecko · LoL API · NPB · KOSPI · RAG. Results normalized into evidence records with per-source confidence."
          example="8–14 sources routed per question"
        />
        <PillarCard
          step="03"
          title="Oracle signs + publishes"
          body="Qwen3 drafts the verdict, Sonnet-4.6 verifies against calibration history, signs the resolution on-chain. Confidence ≥ 0.80 auto-resolves."
          example="Else → human oracle review"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href="/markets/new"
          className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-volt to-volt-dark px-6 py-3.5 text-center text-sm font-bold text-ink-900 shadow-xl transition active:scale-[0.98] sm:inline-flex"
        >
          <span aria-hidden="true">✨</span>
          Propose your first market
          <span
            aria-hidden="true"
            className="transition group-hover:translate-x-0.5"
          >
            →
          </span>
        </Link>
        <Link
          href="/methodology"
          className="flex items-center justify-center gap-1 rounded-full border border-white/10 bg-ink-800 px-5 py-3.5 text-center text-sm font-semibold text-bone transition hover:bg-ink-700 active:scale-[0.98] sm:inline-flex"
        >
          See the full pipeline
        </Link>
      </div>
    </section>
  );
}

function PillarCard({
  step,
  title,
  body,
  example,
}: {
  step: string;
  title: string;
  body: string;
  example: string;
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-ink-800 p-5 transition hover:border-conviction/40">
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-semibold text-conviction">
          {step}
        </span>
        <span className="font-display text-lg text-bone">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-bone-muted">{body}</p>
      <div className="mt-auto pt-4 text-[11px] leading-relaxed text-bone-muted">
        <span className="text-bone-muted/60">e.g. </span>
        <span className="font-mono text-bone">{example}</span>
      </div>
    </div>
  );
}
