import { api } from '@/lib/axios';
import type { UpdateProfileDto, UpdateProfileResponse } from '../auth/types';

export const usersApi = {
  getProfile: () => api.get<UpdateProfileResponse>('/users/profile'),
  updateProfile: (data: UpdateProfileDto) =>
    api.patch<UpdateProfileResponse>('/users/profile', data),
};
