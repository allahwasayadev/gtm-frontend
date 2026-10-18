'use client';

import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import { AlertCircle, Phone } from 'lucide-react';
import {
  applyUsPhoneEdit,
  formatUsPhoneEntry,
  US_DIAL_CODE,
  US_NATIONAL_LENGTH,
} from '@/lib/phone';

interface UsPhoneInputProps {
  /**
   * The digits the field holds. Normally the ten national digits; a leading
   * country code the user typed, or an over-long paste, is kept here too so
   * validation can name it instead of the field hiding it.
   */
  value: string;
  onChange: (digits: string) => void;
  label?: string;
  /** Shown under the field when there is no error. */
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  /** Marked as a new number so a password manager does not offer to save it. */
  autoComplete?: string;
  autoFocus?: boolean;
}

/**
 * US mobile number entry: a fixed +1 and ten digits.
 *
 * There is no country picker. Every user of this product has a US number, and
 * a picker that is only ever set to one value is a step that can only go
 * wrong — it was also the step that let a number be submitted under the wrong
 * country code. The parent keeps the ten digits and calls toUsE164() to get
 * the +1XXXXXXXXXX that is submitted and stored.
 *
 * The +1 is a real part of the field for a screen reader: it is announced by
 * the description the input points at, not left as decoration. `inputMode`
 * and `type="tel"` ask for the numeric keypad; `autocomplete="tel-national"`
 * tells the browser these are national digits, so a saved number is offered
 * without its country code and does not arrive doubled.
 */
export const UsPhoneInput = forwardRef<HTMLInputElement, UsPhoneInputProps>(
  function UsPhoneInput(
    {
      value,
      onChange,
      label = 'Mobile Number',
      helperText,
      error,
      required = false,
      disabled = false,
      id = 'us-phone',
      autoComplete = 'tel-national',
      autoFocus = false,
    },
    forwardedRef,
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    /**
     * Where the caret belongs after the edit now being rendered.
     *
     * A ref rather than state: it is consumed by the layout effect below, and
     * state would mean an extra render on every keystroke just to clear it.
     * Set only by an edit, so the caret is never moved while the user is
     * selecting text or the field re-renders for some other reason.
     */
    const pendingCaretRef = useRef<number | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );

    // Before the browser paints, so the caret never visibly jumps to the end
    // and back. No dependency list: it has to run after whichever render
    // carried the edit, and it does nothing unless that edit left a caret.
    useLayoutEffect(() => {
      const caret = pendingCaretRef.current;
      if (caret === null) return;
      pendingCaretRef.current = null;
      inputRef.current?.setSelectionRange(caret, caret);
    });

    const formatted = formatUsPhoneEntry(value);
    const describedBy = `${id}-prefix-note${error ? '' : helperText ? ` ${id}-helper` : ''}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-ink-2 mb-1.5"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        )}

        <div
          className={`flex items-stretch bg-surface border rounded-md transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-0 focus-within:shadow-sm ${
            error
              ? 'border-danger focus-within:border-danger focus-within:ring-danger'
              : 'border-hairline focus-within:border-accent focus-within:ring-accent'
          } ${disabled ? 'bg-sunken' : ''}`}
        >
          {/* The country code, fixed. Announced through the input's own
              description rather than read out as a stray "+1" before it. */}
          <div
            aria-hidden="true"
            className="flex items-center gap-2 pl-3.5 pr-3 py-2.5 text-sm font-medium text-ink-3 border-r border-hairline rounded-l-md bg-sunken/80 select-none shrink-0"
          >
            <Phone className="w-4 h-4 text-ink-3" />
            {US_DIAL_CODE}
          </div>

          <input
            ref={setRefs}
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            enterKeyHint="done"
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
            value={formatted}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            placeholder="(201) 555-0123"
            onChange={(e) => {
              const edit = applyUsPhoneEdit(
                value,
                e.target.value,
                e.target.selectionStart ?? e.target.value.length,
              );
              onChange(edit.digits);
              pendingCaretRef.current = edit.caret;
            }}
            className="block w-full min-w-0 px-3.5 py-2.5 text-base sm:text-sm text-ink bg-transparent rounded-r-md placeholder:text-ink-3 focus:outline-none disabled:text-ink-3 disabled:cursor-not-allowed"
          />
        </div>

        {/* The +1 is decoration to a screen reader, so the rule it implies is
            stated here instead. Sighted users get it from helperText. */}
        <p id={`${id}-prefix-note`} className="sr-only">
          US mobile number. The country code {US_DIAL_CODE} is already
          included — enter the remaining {US_NATIONAL_LENGTH} digits.
        </p>

        {error ? (
          <p
            role="alert"
            className="mt-1.5 text-sm text-danger flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        ) : (
          helperText && (
            <p id={`${id}-helper`} className="mt-1.5 text-sm text-ink-3">
              {helperText}
            </p>
          )
        )}
      </div>
    );
  },
);
