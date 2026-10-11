'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { Dropdown } from './Dropdown';

interface FilterSheetOption {
  value: string;
  label: string;
}

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  companyFilter: string;
  onCompanyFilterChange: (value: string) => void;
  companyOptions: FilterSheetOption[];
  matchViewFilter: string;
  onMatchViewFilterChange: (value: string) => void;
  matchViewOptions: FilterSheetOption[];
  onClear: () => void;
  activeCount: number;
}

/**
 * The two list filters, moved into a sheet on small screens. Nothing is
 * removed: both dropdowns are the same ones the wide layout shows inline,
 * with the same options and the same handlers.
 */
export function FilterSheet({
  isOpen,
  onClose,
  companyFilter,
  onCompanyFilterChange,
  companyOptions,
  matchViewFilter,
  onMatchViewFilterChange,
  matchViewOptions,
  onClear,
  activeCount,
}: FilterSheetProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => setAnimate(true));
    // Reset on close so the next open animates in again.
    return () => {
      cancelAnimationFrame(frame);
      setAnimate(false);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden">
      <div
        className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${
          animate ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter accounts"
        className={`relative w-full bg-white rounded-t-2xl shadow-2xl transition-transform duration-200 ${
          animate ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-9 h-9 -mr-2 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">
              Company
            </label>
            <Dropdown
              aria-label="Company filter"
              value={companyFilter}
              onChange={onCompanyFilterChange}
              options={companyOptions}
              placeholder="All companies"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-wide uppercase text-slate-500 mb-2">
              Matches
            </label>
            <Dropdown
              aria-label="Match display filter"
              value={matchViewFilter}
              onChange={onMatchViewFilterChange}
              options={matchViewOptions}
            />
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClear}
            disabled={activeCount === 0}
          >
            Clear
          </Button>
          <Button variant="primary" className="flex-1" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
