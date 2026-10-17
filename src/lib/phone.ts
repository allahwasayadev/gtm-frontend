/**
 * US phone entry.
 *
 * Every screen where a user types their own number shows a fixed +1 and
 * collects the ten national digits. There is no country picker: this
 * product's users are US, and a picker that is only ever set to one value is
 * a step that only ever goes wrong. What leaves the browser is always
 * canonical E.164 — +1XXXXXXXXXX — because that is what the API stores and
 * what deduplication and reset-by-phone compare against.
 *
 * Accounts that already hold a non-US number keep working: the API still
 * accepts a number written with its own country code, and the profile screen
 * falls back to a plain international field for one. The US default is an
 * input convenience, not a restriction on existing data.
 *
 * NOTHING HERE TRUNCATES. A number with too many digits is an error the user
 * is shown, never a prefix of itself that happens to parse — ten digits taken
 * off the front of a longer run is a real, reachable, WRONG phone, and we
 * would be texting a verification code to a stranger.
 */

/** Dial code shown beside every phone field. */
export const US_DIAL_CODE = '+1';

/** Digits a user types, after the +1. */
export const US_NATIONAL_LENGTH = 10;

/**
 * How many digits a field will hold at all.
 *
 * Not a truncation of a phone number: E.164 allows 15 digits, so anything
 * this long is already an error the user will be shown. The cap only stops a
 * runaway paste from becoming the field's problem.
 */
export const MAX_ENTRY_DIGITS = 20;

/** A canonical US number: the +1 and exactly ten digits. */
const US_E164 = /^\+1\d{10}$/;

/** Generic E.164, for a number an existing account may already hold. */
const ANY_E164 = /^\+[1-9]\d{7,14}$/;

/**
 * The digits a field should hold, from whatever was typed or pasted.
 *
 * Only strips what is not a digit, and caps absurd length. It does NOT decide
 * what the digits mean — reading a leading country code off them, or refusing
 * them, is usNationalFromEntry()'s job. Keeping the two apart is what stops a
 * long paste quietly becoming a different number: the field holds everything
 * it was given, so the error can name the real digit count.
 */
export function toEntryDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, MAX_ENTRY_DIGITS);
}

/**
 * The ten national digits these entry digits denote, or null.
 *
 * Exactly three shapes are a US number: ten digits; eleven beginning with the
 * country code; and — through toEntryDigits, which has already dropped the
 * '+' — those same eleven from a pasted +1XXXXXXXXXX. Everything else is
 * null, including eleven digits that do NOT begin with 1, which is the shape
 * a stray keystroke produces.
 */
export function usNationalFromEntry(entryDigits: string): string | null {
  if (entryDigits.length === US_NATIONAL_LENGTH) return entryDigits;
  if (
    entryDigits.length === US_NATIONAL_LENGTH + 1 &&
    entryDigits.startsWith('1')
  ) {
    return entryDigits.slice(1);
  }
  return null;
}

/**
 * How a field's digits should read back to the user.
 *
 * Grouped while the digits can still become a US number, and left as a plain
 * run once they cannot — so an over-long paste is visibly over-long instead
 * of wearing the shape of a valid number.
 */
export function formatUsPhoneEntry(entryDigits: string): string {
  const d = entryDigits;

  // Longer than a national number: show it as the plain run it is. It cannot
  // be grouped into something valid-looking when it is not valid.
  if (d.length > US_NATIONAL_LENGTH) return d;

  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Why these entry digits are not a usable US mobile number, or null if they
 * are.
 *
 * Excess digits get their own message with the real count, because the common
 * cause is a paste the user cannot see the end of, and "enter a valid number"
 * would not tell them what is wrong.
 *
 * The area-code rule is the one structural check worth making: a US area code
 * begins 2–9, so it catches a leading 0 and a repeated country code while
 * rejecting no real number. Deliberately NOT enforced are the finer NANP
 * rules (service codes, the central office code's own first digit) — they
 * would turn away nothing a user is likely to type, and over-strict
 * validation that rejects a real number is worse than one Twilio rejects a
 * second later.
 */
export function usPhoneValidationError(entryDigits: string): string | null {
  if (!entryDigits) return 'A mobile number is required to verify your account';

  if (entryDigits.length < US_NATIONAL_LENGTH) {
    const missing = US_NATIONAL_LENGTH - entryDigits.length;
    return `Enter all 10 digits — ${missing} more to go`;
  }

  const national = usNationalFromEntry(entryDigits);
  if (!national) {
    return `That is ${entryDigits.length} digits. A US mobile number has 10, after the ${US_DIAL_CODE}.`;
  }

  if (!/^[2-9]/.test(national)) {
    return 'Enter a 10-digit US number starting with its area code';
  }

  return null;
}

/** Canonical E.164 for these entry digits, or null if they are not a US number. */
export function toUsE164(entryDigits: string): string | null {
  const digits = toEntryDigits(entryDigits);
  if (usPhoneValidationError(digits)) return null;
  return `${US_DIAL_CODE}${usNationalFromEntry(digits)!}`;
}

/** True for a canonical US number as stored by the API. */
export function isUsE164(value: string): boolean {
  return US_E164.test(value.trim());
}

/** True for any E.164 number, including the non-US ones existing accounts hold. */
export function isAnyE164(value: string): boolean {
  return ANY_E164.test(value.trim().replace(/[\s().-]/g, ''));
}

/**
 * The ten national digits held in a stored value, or '' if it is not a US
 * number. Used to seed a +1 field from an account's existing number without
 * ever rewriting a non-US one.
 */
export function usNationalDigitsFromE164(value: string): string {
  const cleaned = value.trim().replace(/[\s().-]/g, '');
  return isUsE164(cleaned) ? cleaned.slice(US_DIAL_CODE.length) : '';
}

/**
 * What to send as the identifier on the reset screens, which take an email
 * address OR a number.
 *
 * An email address is passed through untouched. Anything else that reads as a
 * US number is canonicalised, so someone who types their ten digits — now the
 * only way they have ever entered their number — reaches the same account as
 * +1XXXXXXXXXX. Anything else is sent exactly as typed, never trimmed to fit:
 * the API answers the same neutral message either way, and a number we
 * invented by discarding digits could match somebody else's account.
 */
export function normalizeResetIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes('@')) return trimmed;

  // An explicit country code is the user's choice; honour it.
  if (trimmed.startsWith('+')) {
    const cleaned = trimmed.replace(/[\s().-]/g, '');
    return isAnyE164(cleaned) ? cleaned : trimmed;
  }

  if (!/^[\d\s().-]+$/.test(trimmed)) return trimmed;

  const digits = trimmed.replace(/\D/g, '');
  const national = usNationalFromEntry(digits);
  return national ? `${US_DIAL_CODE}${national}` : trimmed;
}

/** "+12015550123" -> "+1 (201) 555-0123". For showing a number to its owner. */
export function formatPhoneForDisplay(value: string): string {
  const digits = usNationalDigitsFromE164(value);
  return digits ? `${US_DIAL_CODE} ${formatUsPhoneEntry(digits)}` : value;
}

/** Digits in a string. */
export function countDigits(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

/**
 * Where the caret belongs in a formatted number once `digitIndex` digits sit
 * behind it: immediately after that digit, so punctuation the formatter owns
 * never swallows a keystroke.
 */
export function caretAfterDigit(formatted: string, digitIndex: number): number {
  if (digitIndex <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) {
      seen += 1;
      if (seen === digitIndex) return i + 1;
    }
  }
  return formatted.length;
}

export interface UsPhoneEdit {
  /** The digits now held by the field. */
  digits: string;
  /** Where the caret belongs in `formatUsPhoneEntry(digits)`. */
  caret: number;
}

/**
 * One edit of a formatted US phone field, as pure state.
 *
 * The field is formatted as the user types, which means the value the browser
 * reports is not the value we keep. Two things follow, and both are handled
 * here rather than in the component:
 *
 *  - the caret has to be re-placed by digit position, or inserting a digit in
 *    the middle throws it to the end;
 *  - backspacing onto punctuation the formatter inserted has to delete the
 *    digit in front of it. Otherwise the formatter puts the punctuation
 *    straight back and the key appears to do nothing.
 */
export function applyUsPhoneEdit(
  prevDigits: string,
  raw: string,
  caret: number,
): UsPhoneEdit {
  let digitsBehind = countDigits(raw.slice(0, Math.max(0, caret)));
  let digits = toEntryDigits(raw);

  const deletedOnlyPunctuation =
    digits === prevDigits && raw.length < formatUsPhoneEntry(prevDigits).length;

  if (deletedOnlyPunctuation && digitsBehind > 0) {
    digits = digits.slice(0, digitsBehind - 1) + digits.slice(digitsBehind);
    digitsBehind -= 1;
  }

  // A pasted +1XXXXXXXXXX, or a typed country code, says the same thing the
  // fixed +1 beside the field already says. Absorb it rather than showing the
  // user "+1" twice. Only this one unambiguous case is absorbed: eleven
  // digits that do NOT begin with the country code, and anything longer, stay
  // exactly as entered so validation can reject them by their real length.
  if (digits.length === US_NATIONAL_LENGTH + 1 && digits.startsWith('1')) {
    digits = digits.slice(1);
    digitsBehind = Math.max(0, digitsBehind - 1);
  }

  return {
    digits,
    caret: caretAfterDigit(formatUsPhoneEntry(digits), digitsBehind),
  };
}
