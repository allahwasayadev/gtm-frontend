import { api } from '@/lib/axios';
import type { Connection } from './types';

export const connectionsApi = {
  create: (receiverEmail: string) =>
    api.post<Connection>('/connections', { receiverEmail }),
  getAll: (params?: { includeMuted?: boolean }) =>
    api.get<Connection[]>('/connections', {
      params: {
        ...(params?.includeMuted ? { includeMuted: 'true' } : {}),
      },
    }),
  accept: (id: string) => api.post(`/connections/${id}/accept`),
  mute: (id: string) => api.post(`/connections/${id}/mute`),
  unmute: (id: string) => api.post(`/connections/${id}/unmute`),
  delete: (id: string) => api.delete(`/connections/${id}`),
};
