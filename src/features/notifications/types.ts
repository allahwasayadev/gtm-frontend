export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  ctaUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadNotificationsCountResponse {
  count: number;
}
