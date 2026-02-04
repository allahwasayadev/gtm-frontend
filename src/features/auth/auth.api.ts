import { api } from '@/lib/axios';
import type { AuthResponse, User, SignupDto, LoginDto } from './types';

export const authApi = {
  signup: (data: SignupDto) =>
    api.post<AuthResponse>('/auth/signup', data),
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data),
  getProfile: () => api.get<User>('/auth/profile'),
};
