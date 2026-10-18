import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Harbour empty state. The icon sits in a soft accent disc rather than a grey
 * one, so an empty section reads as a place with something to do in it rather
 * than as a section that failed to load.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 px-4">
      <div className="w-16 h-16 bg-accent-soft rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-accent-ink" aria-hidden="true" />
      </div>
      <h3 className="text-[17px] font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-[15px] text-ink-2 max-w-sm mx-auto mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
