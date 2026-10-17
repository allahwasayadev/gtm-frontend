'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isOtpComplete, shouldSubmitOtp, toOtpDigits } from '@/lib/otp';
import { cancelWebOtp } from '@/lib/web-otp';
import { useWebOtpCode } from '@/lib/use-web-otp';

interface CodeInputProps {
  length?: number;
  /** Called once per completed code. */
  onComplete: (code: string) => void;
  /** Every edit, so the parent can clear a stale error as the user retypes. */
  onChange?: (code: string) => void;
  disabled?: boolean;
  /** Describes the field. Defaults to the six-digit code wording. */
  label?: string;
  /** Id of the parent's error or hint text, announced with the field. */
  describedBy?: string;
}

/**
 * The SMS code field: ONE input wearing `length` boxes.
 *
 * Behaviour, logic and tests come from the authorised `phone-plus1-otp-autofill`
 * work (commits 7f7ec7b and 91d09fd) and are carried forward unchanged. Only
 * the presentation below is Harbour's.
 *
 * It used to be `length` separate inputs, which is what stopped the phone
 * offering the code. iOS only puts a received code in the QuickType bar, and
 * Android only offers autofill, for a single field carrying
 * `autocomplete="one-time-code"` — and when the OS does fill a set of boxes,
 * all the digits land in the focused one and the rest stay empty.
 *
 * So the input is real, focusable and full-width, with its glyphs and caret
 * transparent; the boxes behind it are presentation and take no pointer
 * events. Everything the separate boxes did still works, natively rather than
 * by hand: typing, pasting, backspace, select-all and the caret.
 *
 * iOS Safari reads that attribute. Android Chrome does not: it fills a code
 * only when the page asks through WebOTP and the message is bound to this
 * origin — see lib/web-otp.ts. Both are wired up here.
 *
 * Neither is a guarantee. Whether a suggestion appears depends on the device,
 * the OS and browser version, and the message itself. What the page controls
 * is asking correctly, which it now does on both platforms.
 */
export function CodeInput({
  length = 6,
  onComplete,
  onChange,
  disabled = false,
  label,
  describedBy,
}: CodeInputProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // The committed value, held in a ref as well as in state.
  //
  // Deciding whether to submit means comparing against the previous value,
  // and that comparison must not happen inside a state updater: React may
  // call an updater twice, which would submit the same code twice. Every
  // commit comes from an event handler, so a ref is both correct and exact.
  const codeRef = useRef('');
  /** The code already handed to onComplete, so an echo cannot resubmit it. */
  const submittedRef = useRef<string | null>(null);

  const commit = useCallback(
    (next: string) => {
      const previous = codeRef.current;
      if (next === previous) return;

      codeRef.current = next;
      setCode(next);
      onChange?.(next);

      if (shouldSubmitOtp(previous, next, length)) {
        if (submittedRef.current === next) return;
        // Entered by hand, or already filled: stop listening now, before any
        // render, so a code arriving a moment later cannot overwrite this one.
        cancelWebOtp();
        submittedRef.current = next;
        onComplete(next);
        return;
      }

      // Edited away from a full code: the next completion is a new one, so the
      // same digits may be submitted again. That is how a retry works after a
      // wrong-code error, without reloading the screen.
      if (!isOtpComplete(next, length)) submittedRef.current = null;
    },
    [length, onChange, onComplete],
  );

  /**
   * Keep the caret at the end.
   *
   * The boxes fill left to right, so a caret parked in the middle would
   * highlight the wrong box and insert where the user is not looking. Set in
   * a frame of its own because a click's own selection lands after the
   * handler, and NOT on `select`: setting the selection raises that event, so
   * handling it would chase its own tail.
   */
  const caretToEnd = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  }, []);

  // Focus on mount, and again when a failed submit re-enables the field, so a
  // retry starts where the user already is.
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  // Android Chrome. Asked for only while the field is live, abandoned on
  // unmount, on navigation, on a resend, and the moment a code is entered by
  // hand. A filled code goes through commit(), so it obeys the same
  // submit-once rule as a keystroke or a paste and cannot double-verify.
  // Android Chrome. The request itself is armed by whichever screen asked for
  // the message — see lib/web-otp.ts — because it can arrive before this
  // field exists; this only collects the result.
  //
  // Not subscribed once a full code is present: a wrong-code response
  // re-enables the field, and re-subscribing then would let a late arrival
  // overwrite what the user had typed.
  //
  // A collected code goes through commit(), so it obeys the same submit-once
  // rule as a keystroke or a paste and cannot double-verify.
  useWebOtpCode({
    enabled: !disabled && !isOtpComplete(code, length),
    onCode: (filled: string) => commit(toOtpDigits(filled, length)),
  });

  const activeIndex = Math.min(code.length, length - 1);

  return (
    <div className="relative">
      {/* The real field. Visible to the browser and the OS — only its glyphs
          and caret are transparent — because a hidden or zero-opacity input is
          the kind the keyboard declines to offer a code to. */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="\d*"
        autoComplete="one-time-code"
        enterKeyHint="done"
        aria-label={label ?? `Enter the ${length}-digit code we texted you`}
        aria-describedby={describedBy}
        value={code}
        disabled={disabled}
        onChange={(e) => commit(toOtpDigits(e.target.value, length))}
        onFocus={caretToEnd}
        onClick={caretToEnd}
        onPaste={caretToEnd}
        // The global :focus-visible ring in globals.css is the keyboard
        // indicator for the group, so it is kept rather than suppressed; it is
        // only rounded here to frame the boxes instead of cutting their
        // corners. The lit box inside it says which digit is next.
        className="absolute inset-0 z-10 w-full h-full rounded-sm text-center text-base text-transparent caret-transparent bg-transparent border-0 disabled:cursor-not-allowed"
        style={{ WebkitTextFillColor: 'transparent' }}
      />

      <div aria-hidden="true" className="flex gap-2 sm:gap-3 justify-center">
        {Array.from({ length }, (_, index) => {
          const digit = code[index] ?? '';
          const isActive = !disabled && index === activeIndex;
          return (
            <div
              key={index}
              className={`w-11 h-[52px] sm:w-12 sm:h-14 flex items-center justify-center text-xl sm:text-2xl font-bold tabular border-2 rounded-sm transition-colors duration-150 ${
                disabled
                  ? 'bg-sunken text-disabled-outline border-disabled-border'
                  : digit
                    ? 'border-accent text-ink bg-surface'
                    : isActive
                      ? 'border-accent ring-2 ring-accent/20 text-ink bg-surface'
                      : 'border-control text-ink bg-surface'
              }`}
            >
              {digit || (isActive ? <Caret /> : null)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Stands in for the input's own caret, which is transparent. */
function Caret() {
  return (
    <span className="block w-0.5 h-6 sm:h-7 bg-accent motion-safe:animate-pulse" />
  );
}
