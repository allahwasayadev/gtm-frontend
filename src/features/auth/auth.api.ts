import { api } from '@/lib/axios';
import type {
  AuthResponse,
  User,
  SignupDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MessageResponse,
  ValidateResetTokenResponse,
  SendPhoneVerificationCodeDto,
  SendPhoneVerificationCodeResponse,
  VerifyPhoneVerificationCodeDto,
} from './types';

export const authApi = {
  signup: (data: SignupDto) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data),
  getProfile: () =>
    api.get<User>('/auth/profile'),

  // Email Verification
  verifyEmail: (data: VerifyEmailDto) =>
    api.post<AuthResponse>('/auth/verify-email', data),
  resendVerification: (data: ResendVerificationDto) =>
    api.post<MessageResponse>('/auth/resend-verification', data),

  // Phone Verification (signup flow)
  sendPhoneVerificationCode: (data: SendPhoneVerificationCodeDto) =>
    api.post<SendPhoneVerificationCodeResponse>('/auth/phone-verification/send', data),
  verifyPhoneCode: (data: VerifyPhoneVerificationCodeDto) =>
    api.post<AuthResponse>('/auth/phone-verification/verify', data),

  // Password Reset
  forgotPassword: (data: ForgotPasswordDto) =>
    api.post<MessageResponse>('/auth/forgot-password', data),
  validateResetToken: (token: string) =>
    api.get<ValidateResetTokenResponse>(`/auth/verify-reset-token/${token}`),
  resetPassword: (data: ResetPasswordDto) =>
    api.post<MessageResponse>('/auth/reset-password', data),
};
