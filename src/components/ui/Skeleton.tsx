'use client';

import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'line' | 'circle' | 'rect';
  width?: string;
  height?: string;
}

export function Skeleton({
  variant = 'line',
  width,
  height,
  className = '',
  ...props
}: SkeletonProps) {
  const base = 'skeleton-shimmer rounded';
  const variants = {
    line: 'h-4 w-full rounded-md',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      role="status"
      aria-label="Loading"
      {...props}
    />
  );
}

/* --- Pre-built skeleton layouts --- */

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
    <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
      <Skeleton variant="circle" className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0" />
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

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="bg-slate-800 px-4 py-3 flex gap-6">
        <Skeleton className="h-3 w-8 opacity-30" />
        <Skeleton className="h-3 w-40 opacity-30" />
        <Skeleton className="h-3 w-20 opacity-30" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`flex items-center gap-6 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
            <Skeleton variant="rect" className="h-7 w-7 flex-shrink-0" />
            <div className="flex items-center gap-3 flex-1">
              <Skeleton variant="rect" className="hidden sm:block h-8 w-8 flex-shrink-0" />
              <Skeleton className="h-4" style={{ width: `${50 + Math.random() * 30}%` }} />
            </div>
            <Skeleton variant="rect" className="h-6 w-16 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonMatchCard() {
  return (
    <div className="p-3 sm:p-5 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton variant="rect" className="w-10 h-10 flex-shrink-0" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Skeleton variant="rect" className="h-16 w-full" />
        <Skeleton variant="rect" className="h-16 w-full" />
      </div>
    </div>
  );
}

export function SkeletonDashboardLists({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
          <Skeleton variant="rect" className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
