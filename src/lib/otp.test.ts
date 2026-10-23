import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  OTP_LENGTH,
  isOtpComplete,
  shouldSubmitOtp,
  toOtpDigits,
} from './otp.ts';

/** Run with: node --test src/lib/otp.test.ts */

describe('toOtpDigits', () => {
  test('keeps digits and drops everything else', () => {
    assert.equal(toOtpDigits('123456'), '123456');
    assert.equal(toOtpDigits('123 456'), '123456');
    assert.equal(toOtpDigits('12-34-56'), '123456');
    assert.equal(toOtpDigits('abc'), '');
  });

  // maxLength would have cut "123 456" to "123 45" before this ran, which is
  // why the cap lives here instead.
  test('a pasted code with spaces survives in full', () => {
    assert.equal(toOtpDigits('Your code is 123456'), '123456');
  });

  test('caps at the code length', () => {
    assert.equal(toOtpDigits('1234567890'), '123456');
    assert.equal(toOtpDigits('1234', 4), '1234');
  });
});

describe('isOtpComplete', () => {
  test('needs exactly the full length of digits', () => {
    assert.equal(isOtpComplete('123456'), true);
    assert.equal(isOtpComplete('12345'), false);
    assert.equal(isOtpComplete(''), false);
  });
});

describe('shouldSubmitOtp', () => {
  test('submits on the keystroke that completes the code', () => {
    assert.equal(shouldSubmitOtp('12345', '123456'), true);
  });

  test('submits on a paste that completes it in one go', () => {
    assert.equal(shouldSubmitOtp('', '123456'), true);
  });

  test('submits on an OS autofill that completes it in one go', () => {
    assert.equal(shouldSubmitOtp('', '123456'), true);
  });

  // The guarantee: one submission per edit that lands on a full code, however
  // the digits arrived — and none at all for an edit that changed nothing.
  test('does not submit again while the code stays complete', () => {
    assert.equal(shouldSubmitOtp('123456', '123456'), false);
  });

  // Regression: after a wrong code, selecting the lot and pasting the right
  // one replaces a complete code with a complete code in a single edit. Read
  // as "became complete" this submits nothing and the screen looks broken.
  test('submits when one complete code replaces another in one edit', () => {
    assert.equal(shouldSubmitOtp('999999', '123456'), true);
  });

  test('does not submit a partial code', () => {
    assert.equal(shouldSubmitOtp('', '12345'), false);
    assert.equal(shouldSubmitOtp('1234', '12345'), false);
  });

  test('a deletion never submits', () => {
    assert.equal(shouldSubmitOtp('123456', '12345'), false);
  });

  // Retry after a wrong-code error: delete a digit, retype it, submit again.
  test('submits again once the code is broken and remade', () => {
    assert.equal(shouldSubmitOtp('123456', '12345'), false);
    assert.equal(shouldSubmitOtp('12345', '123456'), true);
  });

  test('one typed sequence submits exactly once', () => {
    const keystrokes = ['1', '12', '123', '1234', '12345', '123456'];
    let previous = '';
    let submissions = 0;
    for (const next of keystrokes) {
      if (shouldSubmitOtp(previous, next)) submissions += 1;
      previous = next;
    }
    assert.equal(submissions, 1);
  });

  test('respects a non-default length', () => {
    assert.equal(shouldSubmitOtp('123', '1234', 4), true);
    assert.equal(shouldSubmitOtp('12345', '123456', 4), false);
  });
});

test('the code length matches what the SMS sends', () => {
  assert.equal(OTP_LENGTH, 6);
});
