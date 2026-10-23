import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  __resetWebOtpForTests,
  armWebOtp,
  cancelWebOtp,
  isWebOtpSupported,
  rearmWebOtp,
  releaseWebOtp,
  subscribeToWebOtp,
} from './web-otp.ts';

/**
 * Run with: node --test src/lib/web-otp.test.ts
 *
 * The races these cover are the ones a browser will not reproduce on demand:
 * a message that beats the screen it is meant for, and a result from a
 * request that has since been replaced.
 */

/** One pending navigator.credentials.get call, resolvable by the test. */
interface PendingRequest {
  resolve: (code: string) => void;
  reject: (reason?: unknown) => void;
  aborted: () => boolean;
}

let pending: PendingRequest[] = [];
let listeners: Record<string, (() => void)[]> = {};

function installBrowser({ supported = true } = {}): void {
  pending = [];
  listeners = {};

  const win: Record<string, unknown> = {
    isSecureContext: true,
    addEventListener: (type: string, fn: () => void) => {
      (listeners[type] ??= []).push(fn);
    },
    removeEventListener: (type: string, fn: () => void) => {
      listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
    },
  };
  if (supported) win.OTPCredential = function OTPCredential() {};

  Object.defineProperty(globalThis, 'window', {
    value: win,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      credentials: {
        get: (options: { signal?: AbortSignal }) =>
          new Promise((resolve, reject) => {
            pending.push({
              resolve: (code: string) => resolve({ code }),
              reject,
              aborted: () => options.signal?.aborted === true,
            });
            options.signal?.addEventListener('abort', () =>
              reject(new Error('AbortError')),
            );
          }),
      },
    },
    configurable: true,
    writable: true,
  });
}

/** Let the queued promise callbacks run. */
const settle = () => new Promise((r) => setImmediate(r));

beforeEach(() => {
  installBrowser();
  __resetWebOtpForTests();
});

afterEach(() => {
  __resetWebOtpForTests();
});

describe('support detection', () => {
  test('requires the API and a secure context', () => {
    assert.equal(isWebOtpSupported(), true);

    (globalThis.window as unknown as { isSecureContext: boolean }).isSecureContext = false;
    assert.equal(isWebOtpSupported(), false);
  });

  test('a browser without the API is simply not asked', () => {
    installBrowser({ supported: false });
    assert.equal(isWebOtpSupported(), false);
    armWebOtp();
    assert.equal(pending.length, 0);
  });
});

describe('arming', () => {
  test('asks the browser once, however many screens arm it', () => {
    armWebOtp();
    armWebOtp();
    armWebOtp();
    assert.equal(pending.length, 1);
  });

  test('a subscriber receives a code that arrives while it is listening', async () => {
    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    armWebOtp();

    pending[0].resolve('123456');
    await settle();

    assert.deepEqual(seen, ['123456']);
  });
});

// The reason this is a module and not a hook: the message can beat the
// screen that wants it, including across the client-side navigation from
// /signup to /verify-phone.
describe('a code that arrives before any screen is listening', () => {
  test('is latched and delivered to the first subscriber', async () => {
    armWebOtp();
    pending[0].resolve('123456');
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));

    assert.deepEqual(seen, ['123456'], 'the early code reached the screen');
  });

  test('is delivered only once', async () => {
    armWebOtp();
    pending[0].resolve('123456');
    await settle();

    const first: string[] = [];
    const unsubscribe = subscribeToWebOtp((c) => first.push(c));
    unsubscribe();

    const second: string[] = [];
    subscribeToWebOtp((c) => second.push(c));

    assert.deepEqual(first, ['123456']);
    assert.deepEqual(second, [], 'not replayed to a later screen');
  });
});

describe('resend', () => {
  test('cancels the old request before the new one is asked for', () => {
    armWebOtp();
    const first = pending[0];

    rearmWebOtp();

    assert.equal(first.aborted(), true, 'the superseded request was aborted');
    assert.equal(pending.length, 2, 'a fresh request was armed');
  });

  test('a late result from the superseded request is dropped', async () => {
    armWebOtp();
    const first = pending[0];
    rearmWebOtp();

    // The old request resolves anyway — abort does not guarantee the pending
    // promise loses the race.
    first.resolve('111111');
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));

    assert.deepEqual(seen, [], 'the code for the replaced message was ignored');
  });

  test('the new request still delivers', async () => {
    armWebOtp();
    rearmWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    pending[1].resolve('222222');
    await settle();

    assert.deepEqual(seen, ['222222']);
  });

  test('a code latched before a resend is discarded', async () => {
    armWebOtp();
    pending[0].resolve('111111');
    await settle();

    rearmWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, [], 'the stale code was not handed to the screen');
  });
});

describe('cancelling', () => {
  test('a code entered by hand stops the listener', async () => {
    armWebOtp();
    const first = pending[0];

    cancelWebOtp();
    assert.equal(first.aborted(), true);

    first.resolve('999999');
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, [], 'a later arrival did not overwrite the typing');
  });

  test('leaving the page cancels the request', () => {
    armWebOtp();
    const first = pending[0];

    listeners['pagehide']?.forEach((fn) => fn());

    assert.equal(first.aborted(), true);
  });
});

// A new outbound send must never be served by a listener, or a code, left
// over from an earlier one — a failed signup attempt, an abandoned reset.
describe('a new send replaces whatever was there', () => {
  test('rearming drops a latched code from the previous send', async () => {
    armWebOtp();
    pending[0].resolve('111111');
    await settle();

    rearmWebOtp();
    pending[1].resolve('222222');
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));

    assert.deepEqual(seen, ['222222'], 'only the current send is honoured');
  });

  test('cancelling an abandoned flow leaves nothing for the next screen', async () => {
    armWebOtp();
    pending[0].resolve('111111');
    await settle();

    // Navigating away from the code screen, or logging out.
    cancelWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, [], 'the next screen starts clean');
  });

  test('a failed send cancels, so a later arrival is not applied', async () => {
    armWebOtp();
    const inFlight = pending[0];

    cancelWebOtp(); // what a send's catch block does

    inFlight.resolve('111111');
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, []);
  });
});

// Leaving a screen must not throw away a code that arrived before the screen
// existed — which is the whole point of latching. React runs an effect, its
// cleanup and the effect again on mount in development, so a cleanup that
// discarded the code would lose exactly the message this module exists for.
describe('releasing versus cancelling', () => {
  test('release stops the request but keeps a collected code', async () => {
    armWebOtp();
    pending[0].resolve('123456');
    await settle();

    releaseWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, ['123456'], 'the code survived the remount');
  });

  test('release aborts the in-flight request', () => {
    armWebOtp();
    const first = pending[0];
    releaseWebOtp();
    assert.equal(first.aborted(), true);
  });

  test('an effect that mounts, cleans up and mounts again keeps the code', async () => {
    // The code arrives while the screen is still being set up.
    armWebOtp();
    pending[0].resolve('123456');
    await settle();

    // React's development double-invoke of the screen's effect.
    armWebOtp();
    releaseWebOtp();
    armWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, ['123456']);
  });

  test('cancel, unlike release, does forget it', async () => {
    armWebOtp();
    pending[0].resolve('123456');
    await settle();

    cancelWebOtp();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, []);
  });
});

describe('failure is silent', () => {
  test('a dismissed or timed-out prompt throws nothing and delivers nothing', async () => {
    armWebOtp();
    pending[0].reject(new Error('NotAllowedError'));
    await settle();

    const seen: string[] = [];
    subscribeToWebOtp((c) => seen.push(c));
    assert.deepEqual(seen, []);
  });

  test('a refused request can be armed again', async () => {
    armWebOtp();
    pending[0].reject(new Error('NotAllowedError'));
    await settle();

    armWebOtp();
    assert.equal(pending.length, 2, 'a later send can ask again');
  });
});
