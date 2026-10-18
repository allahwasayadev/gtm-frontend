'use client';

import { useEffect } from 'react';
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

  /*
   * Close when the inline tablet layout takes over.
   *
   * The sheet renders through a portal on document.body, and a portal is not a
   * DOM descendant of this wrapper — so the `md:hidden` class could never hide
   * it. Resizing from 700 to 820 with the sheet open left the dialog mounted
   * above the page, the body still scroll-locked, and the same two filters
   * present twice: once in the stranded sheet and once in the toolbar that had
   * just appeared.
   *
   * Closing here unmounts the sheet and any listbox inside it, which releases
   * the scroll lock and returns focus through Modal's own cleanup. The filter
   * values live in the parent, so nothing is lost: the toolbar controls come up
   * showing exactly what the sheet was showing.
   */
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined' || !window.matchMedia) return;
    const inline = window.matchMedia('(min-width: 768px)');
    if (inline.matches) {
      onClose();
      return;
    }
    const settle = () => {
      if (window.matchMedia('(min-width: 768px)').matches) onClose();
    };
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) onClose();
    };
    // Both signals: the media query is the precise one, and a plain resize
    // listener covers environments where an emulated viewport change does not
    // deliver a matchMedia event.
    inline.addEventListener('change', onChange);
    window.addEventListener('resize', settle);
    return () => {
      inline.removeEventListener('change', onChange);
      window.removeEventListener('resize', settle);
    };
  }, [isOpen, onClose]);

  return (
    // Matches the Filters trigger exactly (md:hidden). It used to be sm:hidden,
    // so between 640 and 767 the trigger was visible but opened nothing. The
    // effect above is what actually dismisses it, because CSS cannot reach the
    // portal this renders through.
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
