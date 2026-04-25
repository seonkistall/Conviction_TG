// Twitter-card image for /markets/[id] reuses the same renderer as the
// OG image. Next's metadata scanner needs these runtime/size/contentType
// fields to be string literals in *this* file — a re-export won't do.

// v2.27-2: Dropped `generateImageMetadata` re-export. See the long
// note in ./opengraph-image.tsx — without that function, Next emits
// exactly one twitter:image per route, which is the right number.
export { default } from './opengraph-image';

export const runtime = 'edge';
export const revalidate = 3600;
export const alt = 'Conviction Market';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
