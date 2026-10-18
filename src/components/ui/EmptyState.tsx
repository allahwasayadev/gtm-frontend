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
 *
 * One renderer at every width. Phones lay it out across — icon beside the
 * words, action full width underneath — so the thing to do stays on the first
 * screen; from sm it centres and opens out. Pages used to carry a second copy
 * of the same words to get that, which is how the two drifted apart.
 */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="px-4 py-5 sm:py-16 sm:text-center">
      <div className="flex items-start gap-3 sm:block">
        <div className="w-10 h-10 sm:w-16 sm:h-16 bg-accent-soft rounded-md sm:rounded-full flex items-center justify-center shrink-0 sm:mx-auto sm:mb-4">
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-accent-ink" aria-hidden="true" />
        </div>
        <div className="min-w-0 sm:contents">
          <h3 className="text-[15px] sm:text-[17px] font-bold text-ink leading-tight sm:mb-1.5">
            {title}
          </h3>
          <p className="mt-0.5 sm:mt-0 text-[13px] sm:text-[15px] text-ink-2 leading-snug sm:leading-relaxed sm:max-w-sm sm:mx-auto sm:mb-6">
            {description}
          </p>
        </div>
      </div>
      {action && (
        <div className="mt-4 sm:mt-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div>
      )}
    </div>
  );
}
