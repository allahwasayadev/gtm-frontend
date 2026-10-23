import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface QuickActionProps {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Second line, shown only where the tile is wide enough to carry it. */
  detail?: string;
  tone?: 'accent' | 'ok';
  dataTour?: string;
}

/**
 * A dashboard quick-action tile, in two shapes.
 *
 * **Below a 332px container** the tiles are a 2×2 of *horizontal* rows — icon
 * beside the label — because four labels cannot hold their measure there.
 * Stacking the icon above the label in that layout made every tile 112px tall
 * and pushed the account list off the first screen entirely.
 *
 * **From a 332px container** they become a single compact row of four, icon
 * above a centred label.
 *
 * The threshold is a container query and the number comes from the widest
 * unbreakable label. "Connections" is one word: about 67px in Lato at 12px and
 * about 75px in the system fallback. With 4px gaps and no horizontal padding a
 * tile gets `(container - 12) / 4`, so a 332px container yields 80px — enough
 * for the fallback with room to spare — while 280px, which is what a 320
 * screen leaves once the scrollbar and gutters are taken, yields 67px and
 * correctly stays 2×2.
 *
 * Measuring the *container* rather than the viewport is the point: a 393 screen
 * with a classic 8px scrollbar and 16px gutters leaves 353px, not 393px.
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
      className="group flex min-h-[56px] items-center gap-2.5 rounded-md border border-hairline bg-surface px-3 py-2 text-left shadow-e1 transition-[border-color,box-shadow] duration-150 hover:border-accent hover:shadow-e2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent @[332px]:min-h-[84px] @[332px]:flex-col @[332px]:justify-center @[332px]:gap-1.5 @[332px]:px-0 @[332px]:py-3 @[332px]:text-center @[420px]:min-h-[96px] @[420px]:gap-2 @[420px]:px-2"
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm @[420px]:h-9 @[420px]:w-9 ${iconTone}`}
        aria-hidden="true"
      >
        <Icon className="h-[17px] w-[17px]" />
      </span>
      <span className="flex min-w-0 flex-col @[332px]:min-h-[30px] @[332px]:w-full @[332px]:items-center @[332px]:justify-center">
        <span className="text-[13px] font-bold leading-tight text-ink @[332px]:text-xs @[420px]:text-[13.5px]">
          {label}
        </span>
        {detail && (
          <span className="mt-0.5 hidden w-full truncate text-xs text-ink-3 @[420px]:block">
            {detail}
          </span>
        )}
      </span>
    </Link>
  );
}

/** 2×2 below a 332px container, four across from there up. */
export function QuickActionGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container mb-3 md:mb-6">
      <div className="grid grid-cols-2 gap-2 @[332px]:grid-cols-4 @[332px]:gap-1 @[420px]:gap-3">
        {children}
      </div>
    </div>
  );
}
