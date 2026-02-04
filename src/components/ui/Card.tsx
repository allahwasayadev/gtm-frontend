import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ hover = false, padding = 'md', className = '', children, ...props }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const hoverStyles = hover
    ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm
        transition-all duration-200
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
    <div className={`border-b border-gray-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-600 mt-1 ${className}`}>
      {children}
    </p>
  );
}
