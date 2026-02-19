import { api } from '@/lib/axios';
import type { AppNotification } from './types';

export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number; cacheBust?: number }) =>
    api.get<AppNotification[]>('/notifications', {
      params: {
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
        ...(typeof params?.limit === 'number' ? { limit: String(params.limit) } : {}),
        ...(typeof params?.cacheBust === 'number' ? { _ts: String(params.cacheBust) } : {}),
      },
    }),
  markRead: (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
