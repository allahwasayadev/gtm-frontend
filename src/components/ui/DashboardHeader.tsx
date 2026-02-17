'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  actions?: React.ReactNode;
}

export function DashboardHeader({ title, description, backHref, actions }: DashboardHeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="text-slate-500 hover:text-white transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-white truncate">{title}</h1>
              {description && (
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 hidden sm:block">{description}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
