# Lighthouse 90+ · Performance Playbook

> Status as of v2.27-4 · expected post-deploy: ~78–85 mobile, ~88–93 desktop.
> This doc is the runbook for getting both above 90 consistently.

## How to measure

```bash
# Local dev
npm run build && npm run start
# Then in Chrome: DevTools → Lighthouse → Mobile + Performance only

# Against prod
chrome --headless https://conviction-fe.vercel.app/ \
  --enable-features=NetworkService \
  --print-to-pdf=lighthouse.pdf
```

Or use the Vercel-hosted Web Vitals dashboard
(`@vercel/speed-insights` already wired in `app/layout.tsx`).

## What v2.27-4 already fixed (~70% payload cut on landing)

| Fix                              | Before | After  | Saving         |
| -------------------------------- | ------ | ------ | -------------- |
| Drop 6 Noto CJK fonts            | 1055KB | 0KB    | ~1055KB / 33 files |
| YouTube `maxres` → `hqdefault`   | 1409KB | ~390KB | ~1019KB        |
| OG meta-tag fanout (1 → 41)      | 41 tags| 1 tag  | HTML-size + correctness |
| Hydration loop on time strings   | 4 errs | 0      | TTI            |
| Mute-FAB on no-video routes      | render | null   | wasted hydrate |

**Estimated remaining gap to 90+ on mobile**: ~5–10 points.

## Remaining quick wins (1–2 hr each)

### 1. Convert all `<img>` to `next/image`
Currently using raw `<img>` for posters, badges, OG previews.
`next/image` gives free lazy loading + responsive `srcset` + AVIF/WebP
automatic format negotiation.

```tsx
// components/AutoVideo.tsx — current
<img src={posterSrc} alt="" loading={priority ? 'eager' : 'lazy'} />

// proposed
<Image
  src={posterSrc}
  alt=""
  width={480}
  height={360}
  sizes="(min-width: 1024px) 280px, 100vw"
  priority={priority}
/>
```
Lighthouse Win: ~3–5 points (image format switch alone is ~30% byte
saving on AVIF-capable browsers).

### 2. Hero LCP optimization
The Hero featured market video iframe is the LCP candidate. Two paths:

**Option A · Render iframe only after first paint**: defer iframe mount
to `requestIdleCallback`. LCP becomes the poster `<img>`, which is
already preloaded.

**Option B · Use a static image LCP**: replace the Hero featured iframe
with a still poster + play button until first user interaction.
Aggressive but Polymarket does exactly this — autoplay video belongs
in the feed, not above the fold.

### 3. Code-split the Cmd+K palette
`CommandPalette.tsx` is rendered at root layout level so it's in the
critical bundle. Move to a `dynamic(() => import('./CommandPalette'),
{ ssr: false })` so it only loads on first ⌘K keystroke.

```tsx
// app/layout.tsx
const CommandPalette = dynamic(
  () => import('@/components/CommandPalette').then((m) => m.CommandPalette),
  { ssr: false }
);
```
Win: ~30KB off the initial JS bundle.

### 4. Remove unused Tailwind CSS
`@tailwindcss/oxide` purge already runs but check `globals.css` for
hand-written utilities that duplicate Tailwind. Look for `.heart-burst`,
`.live-dot`, `.scrollbar-none` — keep them but check none ship dead.

```bash
npx -y tailwindcss --minify --content "components/**/*.tsx" --output /tmp/built.css
wc -c /tmp/built.css   # compare to .next/static/css/*.css
```

### 5. Preconnect to YouTube + i.ytimg.com
The very first request to `https://www.youtube-nocookie.com/embed/...`
takes 200–400ms of DNS + TLS. Add early hints:

```tsx
// app/layout.tsx <head>
<link rel="preconnect" href="https://www.youtube-nocookie.com" />
<link rel="preconnect" href="https://i.ytimg.com" />
```

Win: ~150–300ms LCP improvement on first visit.

### 6. JS bundle audit
```bash
npm run build
npx -y next-bundle-analyzer
```
Look for `recharts`, `d3`, `three.js` — none should be in the bundle
(we don't use them). If anything heavy (e.g. `framer-motion`) snuck in,
replace with hand-rolled CSS animations.

## Hold-the-line (don't regress)

- **No new font-family**. Stick to Inter / Instrument Serif / JetBrains
  Mono for latin. CJK falls through to system font.
- **No client-component bloat**. Keep route trees server-first;
  promote to `'use client'` only at the leaf that needs it.
- **No 1MB+ posters**. New markets must use `hqdefault.jpg` or smaller.
- **No hydration mismatches**. Run Playwright against prod after every
  deploy:

```bash
E2E_BASE_URL=https://conviction-fe.vercel.app npm run e2e
```

The smoke suite at `tests/smoke.spec.ts` includes a `pageerror` watcher
that catches React hydration #425/#418/#422/#423 — failing those is
the early-warning signal.

## Target

| Surface          | Mobile | Desktop |
| ---------------- | ------ | ------- |
| Performance      | 90+    | 95+     |
| Accessibility    | 95+    | 95+     |
| Best Practices   | 95+    | 95+     |
| SEO              | 95+    | 95+     |

If we hit those four metrics on the landing page, every other page
inherits the same baseline (they're lighter).

## Dev workflow

```bash
# Local prod-like
npm run build && npm run start

# In another terminal
npm run lighthouse:landing
# (add this script: chrome --headless --lighthouse-mode=mobile http://localhost:3000)
```

Add the script to `package.json` when first wiring up CI Lighthouse.
