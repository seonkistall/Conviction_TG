/**
 * Inline structured-data emitter.
 *
 * Renders a single <script type="application/ld+json"> tag. Intentionally
 * returns a server-friendly React element (no hooks) so it can drop into
 * any SSG page. The payload is stringified via JSON.stringify — safe as long
 * as the caller controls every field (we only ever pass trusted data from
 * markets.ts), so we don't need the dangerouslyEscape sanitizer here.
 */
interface Props {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
