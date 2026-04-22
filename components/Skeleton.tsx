/**
 * Shared shimmer skeleton primitive. Uses the `.shimmer` keyframe already
 * defined in globals.css (ink-900 → ink-800 gradient pulse at 2.2s).
 *
 * Consumers pass Tailwind width/height classes to shape the block:
 *   <Skeleton className="h-8 w-64 rounded-full" />
 *
 * We respect `prefers-reduced-motion` globally via globals.css so the
 * animation flattens to a static block for motion-sensitive users without
 * needing a per-component check.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`shimmer rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}
