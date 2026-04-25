# iOS Safari · Manual Test Checklist

> Run this against `https://conviction-fe.vercel.app` on a real iPhone.
> WebKit Playwright runs catch most Safari quirks but a handful — autoplay
> policy, gesture nuance, viewport insets — only surface on real hardware.

## Prep

- [ ] Latest iOS (17+) on the device
- [ ] Safari, not Chrome-on-iOS (Chrome iOS uses WebKit too but adds its
      own UA — test base Safari first)
- [ ] Charger plugged in. **Low Power Mode disables autoplay** and we
      want to test the happy path first; LPM is a separate test below.
- [ ] Settings → Safari → Clear History and Website Data (start clean
      so Onboarding actually fires)

## 1. Cold first visit · landing → onboarding → first trade

- [ ] Open `conviction-fe.vercel.app` from Safari address bar
- [ ] **Mobile UA → /feed redirect should fire.** First card visible
      within ~2s, video starts within ~4s.
- [ ] OnboardingIntro 3-slide overlay appears on first visit only
- [ ] Slide 1 ("Trade every APAC narrative") readable, emoji grid renders
- [ ] Slide 2 ("Propose the next market in 45s") wizard mock visible,
      `$0.08 · shipped` chip not clipped
- [ ] Slide 3 ("An Oracle you can audit") evidence list renders, Naver
      / Weverse / Melon labels not clipped
- [ ] "Start trading" CTA closes overlay, `cv_onboarded_v1` set in
      localStorage (verify in Web Inspector)
- [ ] Reload — overlay does NOT reappear

## 2. Feed page · core gestures

- [ ] Vertical scroll snaps card-by-card (no drift, no jank)
- [ ] Top progress bar updates as you scroll
- [ ] Right rail pill icons (♥ Like, 💬 Comment, ℹ Info, X Share) all
      tappable; right rail does NOT overlap the bottom-content tags
      block (regression introduced in v2.22-6)
- [ ] **Heart tap** fills + persists across reload (writes
      `cv_feed_likes_v1` localStorage)
- [ ] **Comment tap** → "Comments · coming soon" toast appears top-right,
      visible for ~3.5s, then auto-dismisses
- [ ] **Info tap** → FeedDetailSheet slides up from bottom, body scroll
      locks, ESC works on hardware keyboard
- [ ] **Share tap** → opens `x.com/intent/tweet` in a new tab
      (Safari should respect noopener), tweet text reads
      "<title> — live on @conviction_apac"
- [ ] **YES tap** on the inline YES/NO buttons → opens
      FeedDetailSheet pre-picked to YES, NOT a direct order
- [ ] **NO tap** → same flow, pre-picked to NO
- [ ] Sheet's stake row ($5/$10/$25/$100) all tappable, selected
      preset highlights volt
- [ ] Sheet's Confirm button commits the trade; toast fires; sheet
      closes; reloading keeps the position visible on /portfolio
- [ ] **Multi-outcome card** (Korean election market) tap → opens
      MultiOutcomeSheet with 4 options; pick → confirm → toast → close

## 3. Feed · pull-to-refresh (v2.26)

- [ ] At feed top (scrollTop=0), drag down with finger → "Pull to
      refresh" pill chip appears
- [ ] Continue dragging past ~70px → label flips to "Release to refresh"
- [ ] Release → spinner spins for ~700ms, items list re-renders
- [ ] Releasing BEFORE threshold → no refresh, no chip residue

## 4. Autoplay quirks

- [ ] First feed card video starts playing automatically (muted)
- [ ] **Tap once** on the card video area → unmutes (MuteFAB also
      flips to "Sound on")
- [ ] Switching to Settings → General → Battery → **enable Low
      Power Mode**, return to Safari, reload `/feed`
- [ ] Video does NOT autoplay → tap-to-play overlay (centered ▶)
      should appear within 6s
- [ ] Tapping the ▶ overlay → video plays, overlay disappears
- [ ] Disable Low Power Mode for remaining tests

## 5. Header / Footer chrome

- [ ] Open `?desktop=1` to bypass /feed redirect → landing page
- [ ] Header fixed at top, Connect button fits within viewport (no
      clipping)
- [ ] Tap Connect → ConnectModal slides up, "Sign-in + wallet · coming
      soon" copy visible, `Notify me` mailto opens Mail app
- [ ] MobileNav (bottom bar) sticky, 4 tabs (Markets / Feed / + / Portfolio)
- [ ] Active tab highlights based on current route
- [ ] Safe-area padding works (no content under home indicator)

## 6. Per-market detail page

- [ ] Tap a market card → /markets/[slug]
- [ ] Hero video autoplays; Notify-me + Share buttons in top-right of
      hero — Notify-me opens Mail app with prefilled subject + body
- [ ] Share opens X intent
- [ ] Live price ticks every ~4s, ▲ / ▼ glyph appears on change
- [ ] OrderBook stake presets ($10/$25/$100/$500) tappable
- [ ] Buy YES / Buy NO commits a position
- [ ] Tap AI Confidence dial → EvidenceSideSheet slides in from right
      with 5–8 source rows, swipe-down to close
- [ ] "View full market" footer CTAs all live

## 7. Portfolio page

- [ ] /portfolio loads (use the bottom MobileNav)
- [ ] Conviction Score card shows your hit-rate IF you have ≥3 positions
- [ ] Watchlist module renders the markets you hearted earlier
- [ ] HotPositions live-tick prices update
- [ ] Activity feed shows your recent trades

## 8. /investors (Tier-1 facing)

- [ ] Hero copy reads honest: 41 live markets · 23 sources · 99% backtest
- [ ] Traction card grid renders 4 cells without horizontal overflow
- [ ] Competitive matrix (6 axes × 3 columns) horizontally scrolls if
      needed without breaking layout
- [ ] Revenue model 2-column grid stacks correctly on mobile
- [ ] Team placeholder cards render
- [ ] Bottom CTA "Request the deck →" opens Mail app

## 9. /methodology

- [ ] Calibration error reads as ~0.018 (NOT 0.000)
- [ ] Calibration curve SVG renders, dots visible at correct positions
- [ ] 23-scraper sections (Search · Social · Domain · Structured)
      collapse cleanly to 1 column on mobile

## 10. Cross-cutting

- [ ] No JS console errors in Safari Web Inspector
- [ ] No 404 network requests on the Network tab (other than
      `i.ytimg.com/.../maxresdefault.jpg` which has fallback chain)
- [ ] No "Sound off" floating chip on /portfolio, /investors,
      /methodology, /leaderboard (v2.27-1 fix)
- [ ] Pinch-zoom works (max 5x)
- [ ] Swiping back-from-edge gesture returns from /markets/[slug] to
      previous page
- [ ] Mobile Safari address bar collapse works (no double-scroll)

## 11. Share previews (separate from in-Safari testing)

After running through, share these URLs in:

- [ ] **iMessage**: `conviction-fe.vercel.app/markets/blackpink-reunion-2026`
      → preview should show BLACKPINK OG card (volt + bone), NOT a BTC card
      (regression caught + fixed in v2.27-3)
- [ ] **WhatsApp**: same URL → same preview
- [ ] **X (in browser)**: same URL → twitter:image preview
- [ ] **Slack**: same URL → unfurl preview matches

## What "passes" looks like

A Tier-1 partner spends ~30s in your demo on their own iPhone.
Pass = nothing visibly broken in that 30s, autoplay works on first
tap, gestures feel native, no loading spinners on screen for >2s.

If any item fails, file with screenshot + iOS version + Low Power
Mode state. Most reproducible bugs are in items 4 (autoplay), 5
(safe-area), 11 (share previews).
