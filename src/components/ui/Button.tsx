import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, disabled, className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

    const variants = {
      primary: 'bg-linear-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 focus:ring-indigo-500/30 active:from-indigo-800 active:to-indigo-700 shadow-sm hover:shadow-md',
      secondary: 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400/30 active:bg-sky-700 shadow-sm',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/30 active:bg-emerald-800 shadow-sm',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/30 active:bg-red-800 shadow-sm',
      outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-indigo-500/20 active:bg-slate-100',
      ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-300/30 active:bg-slate-200'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-5 py-2.5 text-base rounded-xl gap-2'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
