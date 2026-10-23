import Link from 'next/link';

/**
 * The Ovrlap mark and wordmark, as one lockup.
 *
 * The artwork is a single SVG whose viewBox is 700x200 but whose ink only
 * occupies the middle ~66% vertically, so a 60px box draws about 40px of
 * visible brand. That padding is why the header looked undersized at h-12: the
 * box was 48px but the brand inside it read at roughly 32px. Sizes here are
 * chosen against the ink, not the box, and still clear the 64px header row.
 *
 * One component rather than a repeated <img>, so the header, the public policy
 * pages and the export preview all move together.
 *
 * It steps down below 360px. At 320 the brand and the bell-plus-account group
 * are both shrink-0, so a 182px lockup plus a 126px control group plus the
 * row's padding added up to 332 against a 320 viewport and the page scrolled
 * sideways. 44px keeps the lockup 154px wide and the row inside the viewport
 * without hiding or scaling anything.
 */
export function BrandLockup({
  href = '/',
  className = '',
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex shrink-0 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ovrlap-logo.svg"
        alt="Ovrlap"
        className="h-[44px] min-[360px]:h-[52px] sm:h-[56px] lg:h-[60px] w-auto object-contain"
      />
    </Link>
  );
}
