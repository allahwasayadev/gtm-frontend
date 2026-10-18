import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Harbour button.
 *
 * Every size is at least 44px high, which is the target rule for the whole
 * system; `sm` gets there with narrower padding rather than less height.
 *
 * Disabled is a flat fill, a still-readable label and `cursor-not-allowed`
 * — not an opacity fade. A faded label is harder to read precisely when the
 * user is trying to work out why the control will not respond.
 *
 * While loading, the label keeps its space and the spinner is laid over it, so
 * an auto-width button does not grow and shove the control beside it. The
 * label stays in the accessible name; `aria-busy` carries the pending state.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, className = '', children, ...props }, ref) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-bold transition-colors duration-150 ' +
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
      'disabled:cursor-not-allowed disabled:shadow-none ' +
      'active:translate-y-px disabled:active:translate-y-0 motion-reduce:active:translate-y-0';

    const variants = {
      primary:
        'bg-accent text-white shadow-e1 hover:bg-accent-hover active:bg-accent-pressed ' +
        'disabled:bg-disabled-fill disabled:text-disabled-ink',
      secondary:
        'bg-accent-soft text-accent-ink hover:bg-[#cfe0dd] active:bg-[#c3d8d4] ' +
        'disabled:bg-disabled-fill disabled:text-disabled-ink',
      success:
        'bg-ok text-white shadow-e1 hover:bg-[#115a3f] active:bg-[#0e4b35] ' +
        'disabled:bg-disabled-fill disabled:text-disabled-ink',
      danger:
        'bg-transparent text-danger border border-danger hover:bg-danger hover:text-white ' +
        'active:bg-danger-pressed active:border-danger-pressed active:text-white ' +
        'focus-visible:outline-danger disabled:bg-transparent disabled:text-disabled-danger disabled:border-disabled-border',
      outline:
        'bg-surface text-ink border border-control hover:bg-surface-2 active:bg-sunken ' +
        'disabled:bg-surface disabled:text-disabled-outline disabled:border-disabled-border',
      ghost:
        'bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink active:bg-sunken ' +
        'disabled:bg-transparent disabled:text-disabled-outline',
    };

    const sizes = {
      sm: 'min-h-[44px] px-3.5 text-sm rounded-sm gap-1.5',
      md: 'min-h-[44px] px-4 text-[15px] rounded-sm gap-2',
      lg: 'min-h-[48px] px-5 text-base rounded-md gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {/* The label keeps occupying its space so the button's width is the
            same pending as idle. Faded with opacity rather than `visibility`
            or `display`, both of which would take the label out of the
            accessibility tree and leave the button unnamed while it works. */}
        <span className={`inline-flex items-center gap-2 ${isLoading ? 'opacity-0' : ''}`}>
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
