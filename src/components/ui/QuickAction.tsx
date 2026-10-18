import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Second line on wider screens; hidden where the tile is narrow. */
  detail?: string;
  tone?: 'accent' | 'ok';
  dataTour?: string;
}

/**
 * A dashboard quick-action tile.
 *
 * Centred icon above a centred label at every width, with the label slot
 * reserved so a one-line and a two-line tile end up the same height and the
 * row does not step. The whole tile is the target and clears 44px on its own.
 *
 * The grid around it is four across from 360 and a deliberate 2×2 below that:
 * at 320 four labels cannot hold their measure side by side, and "Connections"
 * is a single unbreakable word that needs about 73px in Lato and more in the
 * system fallback, against a tile of roughly 65px.
 */
export function QuickAction({
  href,
  icon: Icon,
  label,
  detail,
  tone = 'accent',
  dataTour,
}: QuickActionProps) {
  const iconTone = tone === 'ok' ? 'bg-ok-soft text-ok' : 'bg-accent-soft text-accent-ink';

  return (
    <Link
      href={href}
      data-tour={dataTour}
      className="group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-md border border-hairline bg-surface px-0.5 @[420px]:px-2 py-4 text-center shadow-e1 transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-e2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${iconTone}`}
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex min-h-[34px] w-full flex-col items-center justify-center">
        <span className="text-[12.5px] @[420px]:text-[13.5px] font-bold leading-tight text-ink">{label}</span>
        {detail && (
          <span className="mt-0.5 hidden w-full truncate text-xs text-ink-3 sm:block">
            {detail}
          </span>
        )}
      </span>
    </Link>
  );
}

/** The grid the tiles sit in: 2×2 below 360, four across from 360 up. */
export function QuickActionGrid({ children }: { children: React.ReactNode }) {
  // A container query, not a viewport one: the rule is about the width the
  // tiles actually get, which is the page container minus its gutters, not the
  // width of the screen.
  return (
    <div className="@container mb-3 md:mb-8">
      <div className="grid grid-cols-2 gap-1.5 @[360px]:grid-cols-4 @[420px]:gap-4">
        {children}
      </div>
    </div>
  );
}
