import Link from 'next/link';

const LEGAL_LINKS = [
  { name: 'About', href: '/about' },
  { name: 'Privacy', href: '/privacy' },
  { name: 'Terms', href: '/terms' },
  { name: 'SMS Terms', href: '/sms-opt-in' },
];

/**
 * The legal and informational destinations, reachable from every signed-in
 * page.
 *
 * These used to sit in the primary navigation, where they pushed Dashboard,
 * Connections and Matches into a horizontal scroller — an Admin with no list
 * had seven tabs competing for the same row. They are still one click away,
 * from here and from the account menu; only their placement changed.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-surface">
      <div className="mx-auto lg:px-14 px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <nav aria-label="Legal and information" className="flex flex-wrap items-center gap-x-1 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-[44px] items-center rounded-sm px-3 text-[13px] text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <p className="px-3 sm:px-0 text-[12.5px] text-ink-3">
            Ovrlap — find where your account lists overlap.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { LEGAL_LINKS };
