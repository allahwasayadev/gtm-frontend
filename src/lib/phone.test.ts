import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyUsPhoneEdit,
  caretAfterDigit,
  formatPhoneForDisplay,
  formatUsPhoneEntry,
  isAnyE164,
  isUsE164,
  normalizeResetIdentifier,
  toEntryDigits,
  toUsE164,
  usNationalDigitsFromE164,
  usNationalFromEntry,
  usPhoneValidationError,
} from './phone.ts';

/**
 * Run with: node --test src/lib/phone.test.ts
 *
 * Node runs TypeScript directly, so these need no test runner, no transform
 * and no new dependency in a repo that had none.
 */

describe('toEntryDigits', () => {
  test('keeps only digits', () => {
    assert.equal(toEntryDigits('(201) 555-0123'), '2015550123');
    assert.equal(toEntryDigits('+1 201 555 0123'), '12015550123');
    assert.equal(toEntryDigits('abc'), '');
  });

  test('does not trim a long run down to a valid-looking number', () => {
    // The whole point: 12 digits stay 12 digits, so validation can say so.
    assert.equal(toEntryDigits('201555012399'), '201555012399');
  });
});

describe('usNationalFromEntry', () => {
  test('accepts exactly ten digits', () => {
    assert.equal(usNationalFromEntry('2015550123'), '2015550123');
  });

  test('accepts eleven digits beginning with the country code', () => {
    assert.equal(usNationalFromEntry('12015550123'), '2015550123');
  });

  test('refuses eleven digits that do not begin with the country code', () => {
    // A stray keystroke, not a country code. Must never become 2015550123.
    assert.equal(usNationalFromEntry('20155501234'), null);
  });

  test('refuses anything longer', () => {
    assert.equal(usNationalFromEntry('201555012399'), null);
    assert.equal(usNationalFromEntry('120155501234'), null);
  });

  test('refuses anything shorter', () => {
    assert.equal(usNationalFromEntry(''), null);
    assert.equal(usNationalFromEntry('201555012'), null);
  });
});

describe('usPhoneValidationError', () => {
  test('passes a valid ten-digit number', () => {
    assert.equal(usPhoneValidationError('2015550123'), null);
  });

  test('passes eleven digits beginning with the country code', () => {
    assert.equal(usPhoneValidationError('12015550123'), null);
  });

  test('asks for the missing digits while typing', () => {
    assert.equal(usPhoneValidationError('201'), 'Enter all 10 digits — 7 more to go');
    assert.equal(
      usPhoneValidationError('201555012'),
      'Enter all 10 digits — 1 more to go',
    );
  });

  test('requires a number at all', () => {
    assert.match(usPhoneValidationError('')!, /required/);
  });

  // Regression: a 12-digit paste must be reported, never truncated.
  test('names the digit count for a 12-digit paste', () => {
    const error = usPhoneValidationError('201555012399');
    assert.equal(error, 'That is 12 digits. A US mobile number has 10, after the +1.');
  });

  // Regression: 11 digits not starting with 1 is not a country code.
  test('rejects an 11-digit number that is not a country code plus ten', () => {
    const error = usPhoneValidationError('20155501234');
    assert.equal(error, 'That is 11 digits. A US mobile number has 10, after the +1.');
  });

  test('rejects an area code that cannot start a US number', () => {
    assert.match(usPhoneValidationError('0015550123')!, /area code/);
    assert.match(usPhoneValidationError('1015550123')!, /area code/);
  });
});

describe('toUsE164', () => {
  test('produces canonical E.164 from ten digits', () => {
    assert.equal(toUsE164('2015550123'), '+12015550123');
  });

  test('produces canonical E.164 from a pasted +1 number', () => {
    assert.equal(toUsE164('+1 (201) 555-0123'), '+12015550123');
    assert.equal(toUsE164('1 201 555 0123'), '+12015550123');
  });

  // Regression: no number at all is far better than the wrong number.
  test('returns null rather than a truncation of a 12-digit paste', () => {
    assert.equal(toUsE164('201555012399'), null);
  });

  test('returns null for an invalid 11-digit number', () => {
    assert.equal(toUsE164('20155501234'), null);
  });

  test('returns null while incomplete', () => {
    assert.equal(toUsE164(''), null);
    assert.equal(toUsE164('201555'), null);
  });

  test('every spelling of one number gives one string', () => {
    const spellings = [
      '2015550123',
      '(201) 555-0123',
      '201-555-0123',
      '1 201 555 0123',
      '+1 (201) 555-0123',
    ];
    assert.deepEqual([...new Set(spellings.map(toUsE164))], ['+12015550123']);
  });
});

describe('formatUsPhoneEntry', () => {
  test('groups progressively while typing', () => {
    assert.equal(formatUsPhoneEntry(''), '');
    assert.equal(formatUsPhoneEntry('2'), '2');
    assert.equal(formatUsPhoneEntry('201'), '201');
    assert.equal(formatUsPhoneEntry('2015'), '(201) 5');
    assert.equal(formatUsPhoneEntry('201555'), '(201) 555');
    assert.equal(formatUsPhoneEntry('2015550123'), '(201) 555-0123');
  });

  // The field absorbs a country code before formatting (see applyUsPhoneEdit),
  // so anything past ten digits here is by definition not a national number.
  test('leaves eleven digits plain', () => {
    assert.equal(formatUsPhoneEntry('12015550123'), '12015550123');
  });

  // An over-long run must look over-long, not like a tidy valid number.
  test('leaves an over-long run plain', () => {
    assert.equal(formatUsPhoneEntry('201555012399'), '201555012399');
  });
});

describe('caretAfterDigit', () => {
  test('lands just after the nth digit', () => {
    assert.equal(caretAfterDigit('(201) 555-0123', 0), 0);
    assert.equal(caretAfterDigit('(201) 555-0123', 3), 4);
    assert.equal(caretAfterDigit('(201) 555-0123', 4), 7);
    assert.equal(caretAfterDigit('(201) 555-0123', 10), 14);
  });

  test('clamps past the end', () => {
    assert.equal(caretAfterDigit('(201) 5', 9), 7);
  });
});

describe('applyUsPhoneEdit', () => {
  test('appends a digit and keeps the caret after it', () => {
    const edit = applyUsPhoneEdit('201', '2015', 4);
    assert.equal(edit.digits, '2015');
    assert.equal(formatUsPhoneEntry(edit.digits), '(201) 5');
    assert.equal(edit.caret, 7);
  });

  test('inserting in the middle leaves the caret in the middle', () => {
    // "(201) 555-0123" with a 9 typed after the area code.
    const edit = applyUsPhoneEdit('2015550123', '(2019) 555-0123', 5);
    assert.equal(edit.digits, '20195550123');
    assert.equal(edit.caret, caretAfterDigit(formatUsPhoneEntry(edit.digits), 4));
  });

  test('backspacing onto punctuation deletes the digit in front of it', () => {
    // Caret sat just after "-", which the formatter owns; the user means the 5.
    const edit = applyUsPhoneEdit('2015550123', '(201) 5550123', 9);
    assert.equal(edit.digits, '201550123');
  });

  test('backspacing a digit deletes exactly that digit', () => {
    const edit = applyUsPhoneEdit('2015550123', '(201) 555-012', 13);
    assert.equal(edit.digits, '201555012');
  });

  // The fixed +1 beside the field already says the country code, so showing
  // it again in the editable part reads as "+1 +1".
  test('absorbs a pasted +1 so the prefix is not shown twice', () => {
    const edit = applyUsPhoneEdit('', '+1 (201) 555-0123', 17);
    assert.equal(edit.digits, '2015550123');
    assert.equal(formatUsPhoneEntry(edit.digits), '(201) 555-0123');
    assert.equal(usPhoneValidationError(edit.digits), null);
  });

  test('absorbs a typed leading country code', () => {
    const edit = applyUsPhoneEdit('1201555012', '12015550123', 11);
    assert.equal(edit.digits, '2015550123');
    assert.equal(edit.caret, caretAfterDigit('(201) 555-0123', 10));
  });

  // The absorb must not become a general "drop a digit until it fits".
  test('does not absorb an 11-digit number that is not a country code plus ten', () => {
    const edit = applyUsPhoneEdit('', '20155501234', 11);
    assert.equal(edit.digits, '20155501234');
    assert.equal(usPhoneValidationError(edit.digits), 'That is 11 digits. A US mobile number has 10, after the +1.');
  });

  test('a 12-digit paste is kept whole', () => {
    const edit = applyUsPhoneEdit('', '201555012399', 12);
    assert.equal(edit.digits, '201555012399');
    assert.equal(usPhoneValidationError(edit.digits)?.includes('12 digits'), true);
  });

  test('select-all then retype replaces the number', () => {
    const edit = applyUsPhoneEdit('2015550123', '4', 1);
    assert.equal(edit.digits, '4');
    assert.equal(edit.caret, 1);
  });
});

describe('normalizeResetIdentifier', () => {
  test('passes an email address through', () => {
    assert.equal(normalizeResetIdentifier(' user@example.test '), 'user@example.test');
  });

  test('canonicalises ten digits', () => {
    assert.equal(normalizeResetIdentifier('2015550123'), '+12015550123');
    assert.equal(normalizeResetIdentifier('(201) 555-0123'), '+12015550123');
    assert.equal(normalizeResetIdentifier('1 201 555 0123'), '+12015550123');
  });

  test('honours an explicit country code', () => {
    assert.equal(normalizeResetIdentifier('+44 20 7946 0958'), '+442079460958');
  });

  // Regression: a reset code must never be sent to a number we invented by
  // discarding digits from what the user typed.
  test('sends an over-long run as typed, never truncated', () => {
    assert.equal(normalizeResetIdentifier('201555012399'), '201555012399');
    assert.equal(normalizeResetIdentifier('20155501234'), '20155501234');
  });

  test('leaves anything else alone', () => {
    assert.equal(normalizeResetIdentifier('not a number'), 'not a number');
    assert.equal(normalizeResetIdentifier(''), '');
  });
});

describe('stored values', () => {
  test('recognises a canonical US number', () => {
    assert.equal(isUsE164('+12015550123'), true);
    assert.equal(isUsE164('+1201555012'), false);
    assert.equal(isUsE164('+442079460958'), false);
  });

  test('recognises any E.164 number', () => {
    assert.equal(isAnyE164('+442079460958'), true);
    assert.equal(isAnyE164('+44 20 7946 0958'), true);
    assert.equal(isAnyE164('2015550123'), false);
  });

  test('seeds a +1 field from a stored US number only', () => {
    assert.equal(usNationalDigitsFromE164('+12015550123'), '2015550123');
    assert.equal(usNationalDigitsFromE164('+442079460958'), '');
    assert.equal(usNationalDigitsFromE164(''), '');
  });

  test('shows a US number grouped and leaves others as they are', () => {
    assert.equal(formatPhoneForDisplay('+12015550123'), '+1 (201) 555-0123');
    assert.equal(formatPhoneForDisplay('+442079460958'), '+442079460958');
  });
});
