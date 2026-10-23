/**
 * WebOTP — the half of Android Chrome's SMS autofill that is not markup.
 *
 * `autocomplete="one-time-code"` is what iOS Safari reads, and it is NOT what
 * drives Chrome on Android. Chrome fills a code only when the page ASKS, via
 * navigator.credentials.get({ otp: ... }), and only when the message's last
 * line binds it to this exact origin:
 *
 *     @www.example.com #123456
 *
 * Both halves are the site's job. See https://web.dev/articles/sms-otp-form.
 *
 * ---
 *
 * This is a module-level controller rather than a hook, for one reason: the
 * message can arrive before the screen that wants it exists.
 *
 * Signing up sends the request, the API answers, and only then does the code
 * screen mount. On a fast network and a fast carrier the SMS can land inside
 * that gap. A listener owned by the code field would not have been armed yet,
 * and Chrome's offer would go to nobody. So the request is armed BEFORE the
 * outbound call, from whichever screen makes it, and a code that arrives with
 * no field waiting is LATCHED until one subscribes — including across the
 * client-side navigation from /signup to /verify-phone, which this module
 * survives because nothing reloads.
 *
 * Everything is best-effort and silent. No support, a dismissed prompt, a
 * message that never comes: the field is left exactly as it was, to type in.
 */

/** The credential Chrome resolves with. Not in TypeScript's DOM library. */
interface SmsOtpCredential extends Credential {
  readonly code: string;
}

interface OtpCredentialRequestOptions extends CredentialRequestOptions {
  otp: { transport: string[] };
}

type Subscriber = (code: string) => void;

let controller: AbortController | null = null;
let subscriber: Subscriber | null = null;

/** A code that arrived before anything was listening. */
let latchedCode: string | null = null;

/**
 * Which request a result belongs to.
 *
 * Aborting does not guarantee the pending promise rejects before a result
 * already in flight resolves. A result carrying a stale generation is from a
 * request we have since abandoned — a superseded message — and is dropped.
 */
let generation = 0;

/**
 * Can this browser be asked at all?
 *
 * The secure-context check is not belt-and-braces: the API is undefined
 * outside one, and localhost counts as secure, which is what makes local
 * testing possible at all.
 */
export function isWebOtpSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext === true &&
    'OTPCredential' in window &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials?.get === 'function'
  );
}

function deliver(code: string): void {
  if (subscriber) {
    subscriber(code);
    return;
  }
  // Nobody is listening yet — the code screen has not mounted. Hold it.
  latchedCode = code;
}

/**
 * Start listening for an SMS code.
 *
 * Call this immediately BEFORE the request that causes a message to be sent,
 * never after awaiting it. Calling it while a request is already armed is a
 * no-op, so a screen may arm defensively without abandoning a live request.
 */
export function armWebOtp(): void {
  if (!isWebOtpSupported()) return;
  if (controller) return;

  const myGeneration = ++generation;
  const myController = new AbortController();
  controller = myController;

  const abortOnLeave = () => cancelWebOtp();
  window.addEventListener('pagehide', abortOnLeave, { once: true });

  void navigator.credentials
    .get({
      otp: { transport: ['sms'] },
      signal: myController.signal,
    } as OtpCredentialRequestOptions)
    .then((credential) => {
      window.removeEventListener('pagehide', abortOnLeave);
      // Superseded by a resend, or cancelled: this result is not wanted.
      if (myGeneration !== generation) return;
      if (controller !== myController) return;

      const code = (credential as SmsOtpCredential | null)?.code;
      if (!code) return;

      controller = null;
      deliver(code);
    })
    .catch(() => {
      window.removeEventListener('pagehide', abortOnLeave);
      // Aborted, dismissed, timed out, unsupported in practice: all the same
      // from here. The user types the code instead.
      if (controller === myController) controller = null;
    });
}

/**
 * Stop listening and forget any code already received.
 *
 * Called at the START of a resend — before the new message is asked for, so
 * the old request cannot deliver a code for the message being replaced — and
 * the moment a code is entered by hand, so a later arrival cannot overwrite
 * what the user typed.
 */
export function cancelWebOtp(): void {
  generation += 1;
  latchedCode = null;
  const current = controller;
  controller = null;
  current?.abort();
}

/**
 * Stop the in-flight request but KEEP a code already collected.
 *
 * For leaving a screen. The distinction from cancelWebOtp matters more than
 * it looks: React runs an effect, its cleanup, and the effect again on mount
 * in development, and a cleanup that discarded the code would throw away a
 * message that arrived before the screen existed — which is the exact case
 * this module was built for. Abandonment that really should forget the code
 * is signalled explicitly instead: a resend, a logout, a failed send, or a
 * code the user typed themselves.
 */
export function releaseWebOtp(): void {
  const current = controller;
  controller = null;
  current?.abort();
}

/** Cancel whatever is armed and arm again, for the message about to be sent. */
export function rearmWebOtp(): void {
  cancelWebOtp();
  armWebOtp();
}

/**
 * Receive codes while subscribed. Returns an unsubscribe function.
 *
 * A code latched before this ran is delivered immediately, which is what
 * makes an SMS that beat the code screen onto the device still usable.
 */
export function subscribeToWebOtp(next: Subscriber): () => void {
  subscriber = next;

  if (latchedCode !== null) {
    const code = latchedCode;
    latchedCode = null;
    next(code);
  }

  return () => {
    if (subscriber === next) subscriber = null;
  };
}

/** Test seam: forget all state between cases. */
export function __resetWebOtpForTests(): void {
  controller?.abort();
  controller = null;
  subscriber = null;
  latchedCode = null;
  generation = 0;
}
