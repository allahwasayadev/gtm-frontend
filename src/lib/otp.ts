/**
 * One-time code entry.
 *
 * The code arrives by SMS, so the phone's own keyboard should offer it: iOS
 * puts it in the QuickType bar and Android offers it through autofill, both
 * keyed off `autocomplete="one-time-code"` on a SINGLE input. Six separate
 * boxes defeat that — the OS fills the focused field and the other five stay
 * empty — which is why the code input is one field wearing six boxes.
 *
 * Whether the suggestion actually appears is the device's decision, not ours.
 * It depends on the OS version, the keyboard in use and the message arriving
 * while the field is focused. The markup is the part we control.
 */

/** Digits in the codes we send. */
export const OTP_LENGTH = 6;

/**
 * The digits held by a code field after an edit.
 *
 * Non-digits are dropped rather than refused, so pasting "123 456" or
 * "Your code is 123456" works, as does an OS filling the field in one go.
 * Length is capped here, not with maxLength: maxLength counts characters, so
 * it would truncate a pasted "123 456" to "123 45" before this ever ran.
 */
export function toOtpDigits(raw: string, length: number = OTP_LENGTH): string {
  return raw.replace(/\D/g, '').slice(0, length);
}

/** True once the field holds a full code. */
export function isOtpComplete(
  value: string,
  length: number = OTP_LENGTH,
): boolean {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

/**
 * Should this edit submit the code?
 *
 * Once per edit that lands on a full code: six keystrokes, a paste and an OS
 * autofill all arrive as edits, so one rule covers all three and the fast
 * path cannot race the slow one. An edit that changes nothing is not an edit
 * — the caller drops those — so a complete code sitting still never
 * resubmits itself.
 *
 * It is deliberately NOT "became complete, having been incomplete". After a
 * wrong-code error the natural thing to do is select the lot and paste the
 * right code, which replaces one complete code with another in a single edit.
 * Under that reading nothing would be submitted and the screen would look
 * broken. Deleting a digit and retyping it works for the same reason.
 */
export function shouldSubmitOtp(
  previous: string,
  next: string,
  length: number = OTP_LENGTH,
): boolean {
  return isOtpComplete(next, length) && next !== previous;
}
