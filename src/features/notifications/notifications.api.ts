import { api } from '@/lib/axios';
import type { AppNotification, UnreadNotificationsCountResponse } from './types';

export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean; limit?: number; offset?: number; cacheBust?: number }) =>
    api.get<AppNotification[]>('/notifications', {
      params: {
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
        ...(typeof params?.limit === 'number' ? { limit: String(params.limit) } : {}),
        ...(typeof params?.offset === 'number' ? { offset: String(params.offset) } : {}),
        ...(typeof params?.cacheBust === 'number' ? { _ts: String(params.cacheBust) } : {}),
      },
    }),
  getUnreadCount: () =>
    api.get<UnreadNotificationsCountResponse>('/notifications/unread-count'),
  markRead: (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
