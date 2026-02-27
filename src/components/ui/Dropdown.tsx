'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  variant?: 'default' | 'light';
  'aria-label'?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = '',
  triggerClassName = '',
  disabled = false,
  variant = 'default',
  'aria-label': ariaLabel,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [listPosition, setListPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-option-${i}`;

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const enabledIndices = useMemo(
    () => options.map((_, i) => i).filter((i) => !options[i].disabled),
    [options],
  );
  const safeHighlightedIndex = (() => {
    if (enabledIndices.length === 0) return 0;
    if (enabledIndices.includes(highlightedIndex)) return highlightedIndex;
    const idx = enabledIndices.findIndex((i) => i >= highlightedIndex);
    return idx >= 0 ? enabledIndices[idx] : enabledIndices[enabledIndices.length - 1];
  })();

  const close = useCallback(() => {
    setIsOpen(false);
    setListPosition(null);
    triggerRef.current?.focus();
  }, []);

  const selectOption = useCallback(
    (option: DropdownOption) => {
      onChange(option.value);
      close();
    },
    [onChange, close],
  );

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    const firstEnabled = options.findIndex((o) => !o.disabled);
    const start = selectedIndex >= 0 && !options[selectedIndex]?.disabled
      ? selectedIndex
      : firstEnabled >= 0 ? firstEnabled : 0;
    setHighlightedIndex(start);
  }, [disabled, selectedIndex, options]);

  const updateListPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const padding = 4;
    setListPosition({
      top: rect.bottom + padding,
      left: rect.left,
      width: Math.max(rect.width, 180),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;

    updateListPosition();
    window.addEventListener('scroll', updateListPosition, true);
    window.addEventListener('resize', updateListPosition);
    return () => {
      window.removeEventListener('scroll', updateListPosition, true);
      window.removeEventListener('resize', updateListPosition);
    };
  }, [isOpen, updateListPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inList = listboxRef.current?.contains(target);
      if (!inTrigger && !inList) close();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, close]);

  useEffect(() => {
    if (!isOpen || options.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case 'ArrowDown': {
          event.preventDefault();
          const nextIdx = enabledIndices.findIndex((i) => i > safeHighlightedIndex);
          setHighlightedIndex(nextIdx >= 0 ? enabledIndices[nextIdx] : enabledIndices[0] ?? 0);
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const prevIdx = enabledIndices.findLastIndex((i) => i < safeHighlightedIndex);
          setHighlightedIndex(prevIdx >= 0 ? enabledIndices[prevIdx] : enabledIndices[enabledIndices.length - 1] ?? 0);
          break;
        }
        case 'Home':
          event.preventDefault();
          setHighlightedIndex(enabledIndices[0] ?? 0);
          break;
        case 'End':
          event.preventDefault();
          setHighlightedIndex(enabledIndices[enabledIndices.length - 1] ?? 0);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (!options[safeHighlightedIndex]?.disabled) {
            selectOption(options[safeHighlightedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, options, safeHighlightedIndex, selectOption, enabledIndices]);

  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const option = listboxRef.current.children[safeHighlightedIndex] as HTMLElement | undefined;
      option?.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen, safeHighlightedIndex]);

  const toggle = useCallback(() => {
    if (isOpen) close();
    else open();
  }, [isOpen, open, close]);

  const handleTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        open();
      }
    } else if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowUp') {
      event.preventDefault();
      close();
    }
  };

  const handleOptionClick = (option: DropdownOption) => {
    if (option.disabled) return;
    selectOption(option);
  };

  return (
    <div ref={containerRef} className={`relative ${className.trim()}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-2.5 pr-3 text-sm rounded-xl cursor-pointer
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variant === 'light'
            ? `bg-white/15 border-white/20 text-white hover:bg-white/25 hover:border-white/30 focus:ring-white/30 ${isOpen ? 'border-white/40 ring-2 ring-white/20' : ''} disabled:hover:bg-white/15`
            : `bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 focus:ring-indigo-500/20 focus:border-indigo-500 ${isOpen ? 'border-indigo-400 ring-2 ring-indigo-500/20' : ''} disabled:hover:bg-white`
          }
          ${triggerClassName}
        `}
      >
        <span className={`truncate ${variant === 'light' ? 'text-white' : selectedOption ? 'text-slate-700' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${variant === 'light' ? 'text-white/90' : 'text-slate-400'} ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen &&
        listPosition &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            className="fixed z-1000 py-1.5 px-1.5 bg-white rounded-xl border border-slate-200 shadow-xl shadow-slate-300/30 overflow-y-auto overflow-x-hidden max-h-60 focus:outline-none"
            style={{
              top: listPosition.top,
              left: listPosition.left,
              width: listPosition.width,
              minWidth: listPosition.width,
            }}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === safeHighlightedIndex;
              const isDisabled = option.disabled;
              return (
                <div
                  key={option.value}
                  id={optionId(index)}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                  onClick={() => handleOptionClick(option)}
                  onMouseEnter={() => !isDisabled && setHighlightedIndex(index)}
                  className={`
                    w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left rounded-lg min-w-0
                    transition-colors duration-150
                    ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    ${isSelected && !isDisabled ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-700'}
                    ${!isDisabled && (isHighlighted || (isSelected && isHighlighted)) ? 'bg-indigo-50' : ''}
                    ${!isDisabled && !isSelected && !isHighlighted ? 'hover:bg-slate-50' : ''}
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
