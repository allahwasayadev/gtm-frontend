import { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, className = '', ...props }, ref) => {
    const inputStyles = error
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full ${Icon ? 'pl-10' : 'px-4'} ${Icon ? 'pr-4' : ''} py-2.5 text-sm text-slate-900
              bg-white border rounded-xl
              placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white focus:shadow-sm
              transition-all duration-200
              disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed
              ${inputStyles}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
