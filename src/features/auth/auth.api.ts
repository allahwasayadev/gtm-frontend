import { api } from '@/lib/axios';
import type {
  AuthResponse,
  User,
  SignupDto,
  SignupPendingResponse,
  LoginDto,
  VerifySignupPhoneDto,
  ResendSignupPhoneDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  MessageResponse,
  SendPhoneVerificationCodeDto,
  SendPhoneVerificationCodeResponse,
  VerifyPhoneVerificationCodeDto,
} from './types';

export const authApi = {
  // Signup no longer returns a session: it returns a pending-verification
  // state, because the account is not usable until the SMS code is entered.
  signup: (data: SignupDto) =>
    api.post<SignupPendingResponse>('/auth/signup', data),
  login: (data: LoginDto) => api.post<AuthResponse>('/auth/login', data),
  getProfile: () => api.get<User>('/auth/profile'),

  // Activation by SMS. Unauthenticated, since signup issues no token.
  verifySignupPhone: (data: VerifySignupPhoneDto) =>
    api.post<AuthResponse>('/auth/phone/verify', data),
  resendSignupPhone: (data: ResendSignupPhoneDto) =>
    api.post<SendPhoneVerificationCodeResponse>('/auth/phone/resend', data),

  // Phone verification from inside the app (profile settings).
  sendPhoneVerificationCode: (data: SendPhoneVerificationCodeDto) =>
    api.post<SendPhoneVerificationCodeResponse>(
      '/auth/phone-verification/send',
      data,
    ),
  verifyPhoneCode: (data: VerifyPhoneVerificationCodeDto) =>
    api.post<AuthResponse>('/auth/phone-verification/verify', data),

  // Password reset: identifier in, 6-digit code to the verified phone.
  // There is no emailed link and no token to pre-validate any more.
  forgotPassword: (data: ForgotPasswordDto) =>
    api.post<MessageResponse>('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordDto) =>
    api.post<MessageResponse>('/auth/reset-password', data),
};
