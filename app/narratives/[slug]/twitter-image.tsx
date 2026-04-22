/**
 * Re-export the opengraph-image implementation for Twitter Cards.
 *
 * Twitter's summary_large_image card renders the same 1200x630 frame,
 * so sharing the exact asset keeps Twitter and OpenGraph fully aligned.
 */
export { default, runtime, alt, size, contentType, generateImageMetadata } from './opengraph-image';
