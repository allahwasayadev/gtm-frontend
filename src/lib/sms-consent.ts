/**
 * SMS consent wording shown to users (A2P 10DLC).
 *
 * Mirrors gtm-backend/src/sms/sms-consent.constants.ts. The backend stores this
 * exact string against the consent record, so the two MUST stay identical —
 * change one and you change the other, and bump the version in both.
 */
export const SMS_CONSENT_VERSION = '2026-09-27.v3';

export const SMS_CONSENT_TEXT =
  'I agree to receive automated SMS messages from Ovrlap containing ' +
  'one-time account verification codes. Consent is not a condition of ' +
  'purchase or of creating an account. Message frequency varies — you ' +
  'receive a message only when you request a verification code. Standard ' +
  'message and data rates may apply. Reply STOP to opt out and HELP for help.';

/** Shown where consent is implicit rather than a checkbox. */
export const SMS_CONSENT_SUMMARY =
  'Ovrlap sends automated SMS for one purpose only: one-time account ' +
  'verification codes — never marketing. Message frequency varies. Standard ' +
  'message and data rates may apply. Reply STOP to opt out and HELP for help.';
