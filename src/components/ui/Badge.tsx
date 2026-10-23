import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md';
}

/**
 * Harbour status chip.
 *
 * Each variant pairs an ink with its own soft fill, so colour is never the
 * only signal: the chip always carries the word as well. Smallest type here
 * is 12px, which is the floor for the whole system.
 */
export function Badge({
  variant = 'default',
  size = 'sm',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-surface-2 text-ink-2',
    success: 'bg-ok-soft text-ok',
    warning: 'bg-warn-soft text-warn',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-accent-soft text-accent-ink',
    outline: 'bg-surface text-ink-2 ring-1 ring-hairline',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1 text-[13px]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full tabular ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
