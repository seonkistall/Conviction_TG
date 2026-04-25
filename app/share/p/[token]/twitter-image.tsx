// Twitter-card image for /share/p/[token] reuses the OG renderer.
// Same v2.27-2 reasoning as the markets twitter-image.tsx — Next's
// metadata scanner needs string-literal exports in *this* file rather
// than a re-export of generateImageMetadata, which would emit one
// twitter:image meta tag per token (we only ever want one).
export { default } from './opengraph-image';

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'Conviction · Shared position';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
