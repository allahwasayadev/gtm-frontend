'use client';

import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'rect';
  width?: string;
  height?: string;
}

/**
 * A single placeholder bar.
 *
 * The bar itself is decorative: one `role="status"` on the surrounding layout
 * announces the wait once, instead of every bar announcing "Loading" in turn.
 */
export function Skeleton({
  variant = 'line',
  width,
  height,
  className = '',
  ...props
}: SkeletonProps) {
  const base = 'skeleton-shimmer rounded-xs';
  const variants = {
    line: 'h-4 w-full rounded-sm',
    circle: 'rounded-full',
    rect: 'rounded-sm',
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* --- Pre-built skeleton layouts ---
   Each matches the geometry of the content it stands in for, so the real rows
   do not move anything when they arrive. */

export function SkeletonCard() {
  return (
    <div role="status" aria-label="Loading" className="bg-surface rounded-lg border border-hairline shadow-e1 p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton variant="rect" className="w-12 h-12" />
      </div>
    </div>
  );
}

export function SkeletonListItem() {
  return (
    <div role="status" aria-label="Loading" className="flex items-center gap-3 p-4 border border-hairline rounded-md bg-surface">
      <Skeleton variant="circle" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="hidden sm:flex gap-2">
        <Skeleton variant="rect" className="h-8 w-20" />
        <Skeleton variant="rect" className="h-8 w-20" />
      </div>
    </div>
  );
}

/* Row widths are fixed per position rather than random. Math.random() in
   render gave every re-render a different set of widths, so the placeholder
   flickered while it was supposed to be holding the layout still. */
const ROW_WIDTHS = ['68%', '54%', '76%', '61%', '72%', '58%', '80%', '64%'];

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="overflow-hidden rounded-md border border-hairline">
      <div className="bg-sunken px-4 py-3 flex gap-6">
        <Skeleton className="h-3 w-8 opacity-40" />
        <Skeleton className="h-3 w-40 opacity-40" />
        <Skeleton className="h-3 w-20 opacity-40" />
      </div>
      <div className="divide-y divide-hairline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3 bg-surface">
            <Skeleton variant="rect" className="h-7 w-7 shrink-0" />
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="rect" className="hidden sm:block h-8 w-8 shrink-0" />
              <Skeleton className="h-4" width={ROW_WIDTHS[i % ROW_WIDTHS.length]} />
            </div>
            <Skeleton variant="rect" className="h-6 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div role="status" aria-label="Loading" className="p-3 sm:p-5 border border-hairline rounded-md bg-surface">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton variant="rect" className="w-10 h-10 shrink-0" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Skeleton variant="rect" className="h-16 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
      </div>
    </div>
  );
}
