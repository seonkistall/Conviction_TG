import type { MetadataRoute } from 'next';

/**
 * Machine-readable crawler policy served from /robots.txt.
 *
 * - Allow all public routes to be crawled.
 * - Disallow /portfolio (user-scoped) — not informative for search engines.
 * - Point crawlers to the auto-generated sitemap so they find every SSG slug.
 */

const BASE_URL = 'https://conviction-fe.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/portfolio', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
