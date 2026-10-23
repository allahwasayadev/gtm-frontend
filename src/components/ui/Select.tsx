import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/** Harbour select. Same 44px height and 16px type as the text field. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? `select-${generatedId}`;
    const errorId = `${selectId}-error`;

    return (
      <div>
        {label && (
          <label htmlFor={selectId} className="block text-[12.5px] text-ink-3 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`
              block w-full min-h-[44px] px-4 py-2.5 pr-10 text-base rounded-sm border appearance-none cursor-pointer
              bg-surface text-ink
              transition-colors duration-150
              focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              disabled:bg-sunken disabled:text-disabled-outline disabled:border-disabled-border disabled:cursor-not-allowed
              ${error ? 'border-danger focus:border-danger' : 'border-control focus:border-accent'}
              ${className}
            `}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-ink-3" aria-hidden="true" />
          </div>
        </div>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-[12.5px] text-danger">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
