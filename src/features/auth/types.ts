export type UserRole = 'Admin' | 'OEM' | 'Reseller';

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  roles: UserRole[];
  hasCompletedOnboarding: boolean;
  emailVerified: boolean;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  /** A2P 10DLC consent state, surfaced so the UI never implies consent. */
  smsConsent?: boolean;
  smsConsentAt?: string | null;
  smsOptedOut?: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  company?: string;
  roles?: UserRole[];
  /** Required: the activation code is sent here by SMS. */
  phoneNumber: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  roles: UserRole[];
  hasCompletedOnboarding: boolean;
  phoneNumber?: string | null;
  isPhoneVerified: boolean;
  createdAt: string;
  token?: string;
}

export interface SendPhoneVerificationCodeDto {
  phoneNumber: string;
  /** A2P 10DLC consent captured on this screen, when applicable. */
  smsConsent?: boolean;
}

export interface SendPhoneVerificationCodeResponse {
  message: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
  expiresAt?: string;
  /** Present only when LOG_PHONE_VERIFICATION_CODE=true (dev/testing) */
  code?: string;
}

export interface VerifyPhoneVerificationCodeDto {
  code: string;
}

export interface VerifyPhoneVerificationCodeResponse {
  message: string;
  phoneNumber: string;
  isPhoneVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  /**
   * Signup only: whether the verification email actually left the server.
   * Absent on other auth responses and on older backends. When it is
   * explicitly false the UI must not claim a code was sent.
   */
  emailVerificationSent?: boolean;
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  roles: UserRole[];
  /** Required: the activation code is sent here by SMS, and nowhere else. */
  phoneNumber: string;
  /** Required: SMS is the only activation channel. */
  smsConsent: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifySignupPhoneDto {
  email: string;
  code: string;
}

export interface ResendSignupPhoneDto {
  email: string;
}

/** Signup returns this instead of a session: the account is not active yet. */
export interface SignupPendingResponse {
  pendingVerification: true;
  email: string;
  /** e.g. "+1 •••• ••1498" — recognisable, not readable. */
  phoneHint: string;
  /** false when Twilio refused; the screen must offer resend, not claim success. */
  smsSent: boolean;
  expiresAt: string | null;
}

export interface ForgotPasswordDto {
  /** Email address OR mobile number. */
  identifier: string;
}

export interface ResetPasswordDto {
  identifier: string;
  code: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

export interface CompleteOnboardingDto {
  hasCompletedOnboarding: true;
}

export interface CompleteOnboardingResponse {
  message: string;
  hasCompletedOnboarding: boolean;
}

// ValidateResetTokenResponse removed with the emailed reset link.
