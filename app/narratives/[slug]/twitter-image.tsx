/**
 * Twitter-card image for /narratives/[slug] reuses the OG renderer.
 *
 * Next's metadata scanner requires string-literal exports for runtime/
 * size/contentType in this file — a re-export of those fields produces
 * a build-time warning and falls back to the default runtime.
 */

// v2.27-2: Stopped re-exporting `generateImageMetadata`. See markets/
// twitter-image.tsx for the explanation.
export { default } from './opengraph-image';

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'Conviction Narrative Index';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
