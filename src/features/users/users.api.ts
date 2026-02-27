import { api } from '@/lib/axios';
import type { CompleteOnboardingDto, CompleteOnboardingResponse, SendPhoneVerificationCodeDto, SendPhoneVerificationCodeResponse, UpdateProfileDto, UpdateProfileResponse, VerifyPhoneVerificationCodeDto, VerifyPhoneVerificationCodeResponse } from '../auth/types';

export const usersApi = {
  getProfile: () => api.get<UpdateProfileResponse>('/users/profile'),
  updateProfile: (data: UpdateProfileDto) =>
    api.patch<UpdateProfileResponse>('/users/profile', data),
  sendPhoneVerificationCode: (data: SendPhoneVerificationCodeDto) =>
    api.post<SendPhoneVerificationCodeResponse>(
      '/users/profile/phone-verification/send',
      data,
    ),
  verifyPhoneVerificationCode: (data: VerifyPhoneVerificationCodeDto) =>
    api.post<VerifyPhoneVerificationCodeResponse>(
      '/users/profile/phone-verification/verify',
      data,
    ),
  completeOnboarding: (data: CompleteOnboardingDto) =>
    api.patch<CompleteOnboardingResponse>('/users/onboarding/complete', data),
};
