'use client';

import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';

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
  // Escape, scroll lock, focus trap, focus return and the entry animation all
  // come from Modal's sheet variant now.

  return (
    // Matches the Filters trigger exactly (md:hidden). It used to be sm:hidden,
    // so between 640 and 767 the trigger was visible but opened nothing.
    <div className="md:hidden">
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Filters"
        variant="sheet"
        showClose
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={onClear} disabled={activeCount === 0}>
              Clear
            </Button>
            <Button variant="primary" className="flex-1" onClick={onClose}>
              Done
            </Button>
          </>
        }
      >
        <div className="space-y-4 pb-[env(safe-area-inset-bottom)]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.07em] text-ink-3">
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
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.07em] text-ink-3">
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
      </Modal>
    </div>
  );
}
