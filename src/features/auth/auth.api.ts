import { api } from '@/lib/axios';
import type {
  AuthResponse,
  User,
  SignupDto,
  SignupPendingResponse,
  LoginDto,
  ActivationTokenDto,
  SetActivationPhoneDto,
  VerifyActivationDto,
  ActivationSendResponse,
  ActivationFromSessionResponse,
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

  // Activation. Authorised by the short-lived activation token from signup or
  // from a password-correct login — never by an email address alone.
  // Migration path for sessions that are already active.
  activationFromSession: () =>
    api.post<ActivationFromSessionResponse>('/auth/activation/from-session'),
  setActivationPhone: (data: SetActivationPhoneDto) =>
    api.post<ActivationSendResponse>('/auth/activation/phone', data),
  resendActivation: (data: ActivationTokenDto) =>
    api.post<ActivationSendResponse>('/auth/activation/resend', data),
  verifyActivation: (data: VerifyActivationDto) =>
    api.post<AuthResponse>('/auth/activation/verify', data),

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
