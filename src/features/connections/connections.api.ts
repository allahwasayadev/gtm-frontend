import { api } from '@/lib/axios';
import type { Connection } from './types';

export const connectionsApi = {
  create: (receiverEmail: string) =>
    api.post<Connection>('/connections', { receiverEmail }),
  getAll: () => api.get<Connection[]>('/connections'),
  accept: (id: string) => api.post(`/connections/${id}/accept`),
  delete: (id: string) => api.delete(`/connections/${id}`),
};
