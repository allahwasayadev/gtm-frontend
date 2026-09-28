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
  phoneNumber?: string;
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
  phoneNumber?: string;
  /** A2P 10DLC consent. Optional — declining must not block account creation. */
  smsConsent?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
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

export interface ValidateResetTokenResponse {
  valid: boolean;
  email?: string;
}
