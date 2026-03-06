import { api } from '@/lib/axios';
import type { CompleteOnboardingDto, CompleteOnboardingResponse, SendPhoneVerificationCodeDto, SendPhoneVerificationCodeResponse, UpdateProfileDto, UpdateProfileResponse, UserRole, VerifyPhoneVerificationCodeDto, VerifyPhoneVerificationCodeResponse } from '../auth/types';

export interface ListUserItem {
  id: string;
  email: string;
  name: string;
  company: string | null;
  roles: UserRole[];
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalLists: number;
  totalMappings: number;
  totalOverlaps: number;
}

export const usersApi = {
  getProfile: () => api.get<UpdateProfileResponse>('/users/profile'),
  getAdminStats: () => api.get<AdminStats>('/users/stats'),
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
  deleteMyAccount: () =>
    api.delete<{ message: string }>('/users/profile'),
  getUsers: () =>
    api.get<ListUserItem[]>('/users'),
  deleteUser: (userId: string) =>
    api.delete<{ message: string }>(`/users/${userId}`),
};
