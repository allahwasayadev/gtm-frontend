import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Harbour card. A warm surface on the cream canvas, separated by a hairline
 * rather than by a heavy shadow — the shadow only lifts it a little, and the
 * hover state belongs to cards that are actually links.
 */
export function Card({ hover = false, padding = 'md', className = '', children, ...props }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const hoverStyles = hover
    ? 'hover:border-accent hover:shadow-e2 cursor-pointer'
    : '';

  return (
    <div
      className={`
        bg-surface rounded-lg border border-hairline shadow-e1
        transition-[border-color,box-shadow] duration-150
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`border-b border-hairline pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-[17px] font-bold text-ink ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[12.5px] text-ink-3 mt-1 ${className}`}>
      {children}
    </p>
  );
}
