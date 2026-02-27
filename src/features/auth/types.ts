export interface User {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  isOemSeller: boolean;
  hasCompletedOnboarding: boolean;
  emailVerified: boolean;
  phoneNumber?: string | null;
  isPhoneVerified?: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
  email?: string;
  company?: string;
  isOemSeller?: boolean;
  phoneNumber?: string;
}

export interface UpdateProfileResponse {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  isOemSeller: boolean;
  hasCompletedOnboarding: boolean;
  phoneNumber?: string | null;
  isPhoneVerified: boolean;
  createdAt: string;
  token?: string;
}

export interface SendPhoneVerificationCodeDto {
  phoneNumber: string;
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
}

export interface SignupDto {
  name: string;
  email: string;
  password: string;
  company?: string;
  isOemSeller: boolean;
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
