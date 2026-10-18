'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface CodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

/**
 * Six-box verification code entry.
 *
 * The behaviour here is the deployed behaviour and is deliberately unchanged:
 * `length` separate single-character inputs, auto-advance on entry, backspace
 * steps back out of an empty box, paste distributes digits across the boxes,
 * and `onComplete` fires as soon as every box is filled. The props are the
 * same three the rest of the app passes.
 *
 * A separate, already-authorised branch (`phone-plus1-otp-autofill`) replaces
 * this with one real input behind presentational cells so platform SMS
 * autofill can reach it. That rewrite belongs to that branch; this one is
 * restyled only, so the two can be merged without fighting over behaviour.
 */
export function CodeInput({ length = 6, onComplete, disabled = false }: CodeInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newValues = [...values];
    newValues[index] = value.slice(-1); // Take only last character
    setValues(newValues);

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const code = newValues.join('');
    if (code.length === length && !newValues.includes('')) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newValues = [...values];
    pastedData.split('').forEach((char, i) => {
      newValues[i] = char;
    });
    setValues(newValues);

    if (pastedData.length === length) {
      onComplete(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={index === 0}
          aria-label={`Digit ${index + 1} of ${length}`}
          className="w-11 h-[52px] sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold tabular
                     text-ink bg-surface border-2 border-control rounded-sm
                     focus:border-accent focus:outline-none
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                     disabled:bg-sunken disabled:text-disabled-outline disabled:border-disabled-border
                     disabled:cursor-not-allowed
                     transition-colors duration-150"
        />
      ))}
    </div>
  );
}
