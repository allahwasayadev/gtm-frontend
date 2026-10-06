/**
 * The activation token is a credential: it authorises finishing phone
 * verification on one account. It must never go in a URL, where it would be
 * captured by browser history, server logs and Referer headers.
 *
 * sessionStorage keeps it to the one tab and clears it when that tab closes,
 * which matches how long activation should take.
 */
const KEY = 'ovrlap.activation';

export interface ActivationState {
  token: string;
  email: string;
  phoneHint: string | null;
  /** Account has no number on file — ask for one before sending a code. */
  needsPhoneNumber: boolean;
  /** False when Twilio refused, so the screen does not claim a code was sent. */
  smsSent: boolean;
}

export function storeActivation(state: ActivationState): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or blocked storage. The screen handles a missing state by
    // asking the user to sign in again, which is the correct fallback.
  }
}

export function readActivation(): ActivationState | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivationState) : null;
  } catch {
    return null;
  }
}

export function clearActivation(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
