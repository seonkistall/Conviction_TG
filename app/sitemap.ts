import type { MetadataRoute } from 'next';
import {
  MARKETS,
  NARRATIVE_INDICES,
  AI_TRADERS,
  TRADERS,
} from '@/lib/markets';

/**
 * Auto-generated sitemap.xml served from /sitemap.xml.
 *
 * Includes every SSG'd route so search engines can discover markets,
 * narratives, and traders without relying on internal-link crawl depth.
 * Priorities follow hub → detail: landing > hub pages > details.
 */

const BASE_URL = 'https://conviction-fe.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/feed`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/leaderboard`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },
    { url: `${BASE_URL}/markets/new`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/worlds-2026`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const marketRoutes: MetadataRoute.Sitemap = MARKETS.map((m) => ({
    url: `${BASE_URL}/markets/${m.slug}`,
    lastModified: now,
    changeFrequency: 'hourly' as const,
    priority: m.trending ? 0.8 : 0.6,
  }));

  const narrativeRoutes: MetadataRoute.Sitemap = NARRATIVE_INDICES.map((n) => ({
    url: `${BASE_URL}/narratives/${n.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const traderRoutes: MetadataRoute.Sitemap = [...AI_TRADERS, ...TRADERS].map(
    (t) => ({
      url: `${BASE_URL}/traders/${t.handle}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })
  );

  return [...staticRoutes, ...marketRoutes, ...narrativeRoutes, ...traderRoutes];
}
