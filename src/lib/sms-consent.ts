/**
 * SMS consent wording shown to users (A2P 10DLC).
 *
 * Mirrors gtm-backend/src/sms/sms-consent.constants.ts. The backend stores this
 * exact string against the consent record, so the two MUST stay identical —
 * change one and you change the other, and bump the version in both.
 */
export const SMS_CONSENT_VERSION = '2026-10-04.v4';

export const SMS_CONSENT_TEXT =
  'I agree to receive automated SMS messages from Ovrlap containing one-time ' +
  'account verification and password reset codes. A verification code sent to ' +
  'this number is required to activate your account, so SMS is needed to ' +
  'finish signing up and to reset your password. Message frequency varies — ' +
  'you receive a message only when you request a code. Standard message and ' +
  'data rates may apply. Reply STOP to opt out and HELP for help.';

/** Shown where consent is implicit rather than a checkbox. */
export const SMS_CONSENT_SUMMARY =
  'Ovrlap sends automated SMS for one purpose only: one-time account ' +
  'verification and password reset codes — never marketing. A code is ' +
  'required to activate your account. Message frequency varies. Standard ' +
  'message and data rates may apply. Reply STOP to opt out and HELP for help.';
