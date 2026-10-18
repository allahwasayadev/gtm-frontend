import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
}

/**
 * Harbour text field.
 *
 * 44px high and 16px type: anything smaller makes iOS Safari zoom the page
 * on focus, which then leaves the layout shifted. The label is bound to the
 * input with a real id, and the error and helper text are wired through
 * aria-describedby so a screen reader reaches them in order.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const describedBy =
      [error ? errorId : null, helperText && !error ? helperId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const fieldStyles = error
      ? 'border-danger focus:border-danger'
      : 'border-control focus:border-accent';

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[12.5px] text-ink-3 mb-1.5">
            {label}
            {props.required && <span className="text-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-ink-3" aria-hidden="true" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`
              block w-full min-h-[44px] ${Icon ? 'pl-10 pr-4' : 'px-4'} py-2.5 text-base text-ink
              bg-surface border rounded-sm
              placeholder:text-ink-3
              focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              transition-colors duration-150
              disabled:bg-sunken disabled:text-disabled-outline disabled:border-disabled-border disabled:cursor-not-allowed
              ${fieldStyles}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-[12.5px] text-danger flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-[12.5px] text-ink-3">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
