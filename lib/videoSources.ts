/**
 * v2.27-5 — Pexels-backed video source helper.
 *
 * Why this exists
 * ---------------
 * Several APAC markets (IPL cricket, NPB Yakult, MLBB Jakarta, etc.)
 * currently reuse the verified-but-thematically-wrong "T1 Worlds 2025"
 * YouTube clip because we don't have a curated catalog of cricket /
 * baseball / SEA-esports B-roll. Pexels has free CC0-equivalent stock
 * footage covering most of those gaps, and their HTTP API is the
 * cheapest way to bring topic-matched video into the demo without a
 * licensing pipeline.
 *
 * How to wire it up
 * -----------------
 *   1. Create a free Pexels account at https://www.pexels.com/api/
 *   2. Copy the API key from the dashboard
 *   3. Add it to `.env.local` (and to Vercel project env vars):
 *        PEXELS_API_KEY=<your-key>
 *   4. Run `npm run videos:audit` (helper script — see TODO below)
 *      to refresh the per-market video mapping.
 *
 * Without a key, this module gracefully no-ops: callers fall back to
 * whatever YouTube ID the Market record holds today, which is already
 * playable. So shipping this file is safe even before the key lands.
 *
 * Cost
 * ----
 * Pexels free tier: 200 requests/hour, 20k requests/month. Refreshing
 * 41 markets takes 41 requests; a daily cron is ~1230/month, well
 * under the cap. No paid tier is needed for the foreseeable future.
 */

export interface PexelsVideoFile {
  id: number;
  url: string;
  width: number;
  height: number;
  fps: number;
  link: string; // Direct CDN MP4 URL — what we actually <video src=...> with
  quality: 'sd' | 'hd' | 'uhd';
}

export interface PexelsVideo {
  id: number;
  /** Page on pexels.com to attribute the creator */
  url: string;
  /** Thumbnail URL — drop into `MediaSource.poster` */
  image: string;
  /** Available file variants — pick by `quality` and aspect ratio */
  video_files: PexelsVideoFile[];
  user: { name: string; url: string };
}

interface SearchResponse {
  videos: PexelsVideo[];
  total_results: number;
  page: number;
  per_page: number;
}

const API_BASE = 'https://api.pexels.com/videos';

/**
 * Search Pexels for stock video matching a topic query.
 *
 * Returns `null` when no API key is configured (caller falls back to
 * whatever video the Market already has). Throws on network errors so
 * an audit script can surface them.
 *
 * @example
 *   const cricket = await pexelsSearch('cricket batsman stadium');
 *   if (cricket) {
 *     market.media = pexelsToMediaSource(cricket);
 *   }
 */
export async function pexelsSearch(
  query: string,
  opts: { perPage?: number; orientation?: 'portrait' | 'landscape' | 'square' } = {}
): Promise<PexelsVideo | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) {
    // Intentionally no-op without a key. We log once via the caller's
    // discretion (audit scripts) but don't spam server logs in prod.
    return null;
  }

  const params = new URLSearchParams({
    query,
    per_page: String(opts.perPage ?? 5),
    orientation: opts.orientation ?? 'portrait',
  });

  const res = await fetch(`${API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: key },
    // Cache aggressively — same query, same key returns same top hit.
    next: { revalidate: 86_400 },
  });
  if (!res.ok) {
    throw new Error(`Pexels search failed: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as SearchResponse;
  // First result is Pexels's own relevance ranking. Good enough for
  // poster-quality matches; an audit script can hand-pick if needed.
  return data.videos[0] ?? null;
}

/**
 * Pick the smallest video file that's at least HD-quality. Avoids
 * pulling 4K masters when the player will downscale to 720p anyway.
 */
export function pickPexelsFile(v: PexelsVideo): PexelsVideoFile | null {
  // Prefer HD, then SD, then UHD (in that priority — UHD is bandwidth
  // overkill for a poster autoplay).
  const order = ['hd', 'sd', 'uhd'] as const;
  for (const q of order) {
    const f = v.video_files.find((x) => x.quality === q);
    if (f) return f;
  }
  return v.video_files[0] ?? null;
}

/**
 * Convert a Pexels search hit to a `MediaSource` that AutoVideo can
 * consume directly. Returns null if no playable file exists.
 */
export function pexelsToMediaSource(
  v: PexelsVideo
):
  | {
      kind: 'mp4';
      src: string;
      poster: string;
      pexelsCredit: { name: string; url: string };
    }
  | null {
  const file = pickPexelsFile(v);
  if (!file) return null;
  return {
    kind: 'mp4',
    src: file.link,
    poster: v.image,
    // Pexels license requires attribution if shown commercially. We
    // surface it on hover/long-press in AutoVideo when this credit
    // field is set — see components/AutoVideo.tsx (TODO when wired).
    pexelsCredit: { name: v.user.name, url: v.user.url },
  };
}

/*
 * v2.27-5 — TODO: ship a `scripts/audit-videos.ts` Node script that:
 *
 *   1. Loads `lib/markets.ts`
 *   2. For each market with a known thematic mismatch (annotate via
 *      a `videoQuery` field on the Market type), calls pexelsSearch
 *      with the query.
 *   3. Prints a diff: "IPL 2026 opener (current: AOTfM6H8XOo →
 *      proposed: pexels.com/video/<id>)"
 *   4. With `--apply`, rewrites lib/markets.ts.
 *
 * Until that script exists, the swap is a manual lookup-and-edit pass
 * the maintainer can do once a Pexels key is provisioned. The pure-
 * runtime helpers above are already safe to import without a key.
 */
