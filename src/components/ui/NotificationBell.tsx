'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { apiBaseUrl } from '@/lib/axios';
import { notificationsApi } from '@/features/notifications/notifications.api';
import type { AppNotification } from '@/features/notifications/types';
import { Button } from './Button';

function formatTimestamp(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await notificationsApi.getAll({
        limit: 25,
        cacheBust: Date.now(),
      });
      setNotifications(response.data);
    } catch {
      if (!silent) {
        setNotifications([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const socket: Socket = io(`${apiBaseUrl}/notifications`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
    });

    const handleRealtimeNotification = (notification: AppNotification) => {
      setNotifications((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.id === notification.id,
        );
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = notification;
          return next;
        }

        return [notification, ...prev].slice(0, 25);
      });
    };
    const handleSocketConnect = () => {
      void loadNotifications(true);
    };
    const handleSocketReconnect = () => {
      void loadNotifications(true);
    };
    const manager = socket.io;

    socket.on('connect', handleSocketConnect);
    socket.on('notifications.new', handleRealtimeNotification);
    manager.on('reconnect', handleSocketReconnect);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('notifications.new', handleRealtimeNotification);
      manager.off('reconnect', handleSocketReconnect);
      socket.disconnect();
    };
  }, [loadNotifications]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadNotifications(true);
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    setMarkingAllRead(true);
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch {
      // Keep the menu usable even if the read-all endpoint fails.
    } finally {
      setMarkingAllRead(false);
    }
  }, []);

  const handleBellClick = () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);

    if (shouldOpen) {
      void markAllRead();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications(true);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Notifications
              </p>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Refresh notifications"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto px-3 py-3">
            {loading ? (
              <p className="px-1 py-4 text-center text-sm text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-slate-500">
                You have no notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border px-3 py-2.5 ${
                    notification.isRead
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-sky-200 bg-sky-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {notification.message}
                      </p>
                    </div>
                    {notification.ctaUrl && (
                      <Link
                        href={notification.ctaUrl}
                        onClick={() => setIsOpen(false)}
                      >
                        <Button variant="primary" size="sm">
                          View
                        </Button>
                      </Link>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              isLoading={markingAllRead}
              disabled={unreadCount === 0}
              onClick={() => void markAllRead()}
            >
              Mark All Read
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
