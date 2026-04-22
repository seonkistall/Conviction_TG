// Twitter-card image for /markets/[id] reuses the same renderer as the
// OG image. Next's metadata scanner needs these runtime/size/contentType
// fields to be string literals in *this* file — a re-export won't do.

export { default, generateImageMetadata } from './opengraph-image';

export const runtime = 'edge';
export const alt = 'Conviction Market';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
