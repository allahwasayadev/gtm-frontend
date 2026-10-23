'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, X } from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { apiBaseUrl } from '@/lib/axios';
import { notificationsApi } from '@/features/notifications/notifications.api';
import type { AppNotification } from '@/features/notifications/types';
import { Button } from './Button';
import { useOverlayBehaviour } from '@/lib/useOverlayBehaviour';
const NOTIFICATIONS_PAGE_SIZE = 25;

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
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /* A failed load used to clear the list, so a network error was indistinguishable
     from an empty inbox. The panel says which one it is now. */
  const [loadFailed, setLoadFailed] = useState(false);
  /* The panel is two different things: a scrim-backed sheet over the page below
     lg, and an ordinary popover beside the bell above it. Declaring aria-modal
     on both was a promise the desktop popover does not keep — nothing traps
     focus there, and nothing should. The semantics follow the layout. */
  const [isModalLayout, setIsModalLayout] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // The panel is fixed on phones, so it needs the header's real bottom edge.
  // Hard-coding 64px put it under the mobile nav row, which is 48px tall.
  const [headerBottom, setHeaderBottom] = useState(112);
  // Opening marks everything read server-side. Snapshot what was unread so the
  // panel still shows which items are new for as long as it is open.
  const [unreadAtOpen, setUnreadAtOpen] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const refetchUnreadCountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    /* The header keeps its own nav row until xl, so the panel has to stay a
       sheet until then too. Switching at lg made it an absolute popover from
       1024 while that nav row was still on screen, and it covered it. */
    const mq = window.matchMedia('(max-width: 1279.98px)');
    const sync = () => setIsModalLayout(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const closePanel = useCallback(() => setIsOpen(false), []);

  /* Only the phone sheet is modal, so only it takes the trap, the scroll lock
     and a place on the overlay stack. The desktop popover stays modeless. */
  useOverlayBehaviour(isOpen && isModalLayout, closePanel, panelRef);

  const refetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {
      // Keep current count on error
    }
  }, []);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        notificationsApi.getAll({ limit: NOTIFICATIONS_PAGE_SIZE, offset: 0, cacheBust: Date.now() }),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(notificationsResponse.data);
      setUnreadCount(unreadCountResponse.data.count);
      setHasMore(notificationsResponse.data.length === NOTIFICATIONS_PAGE_SIZE);
      setLoadFailed(false);
    } catch {
      if (!silent) {
        // Keep nothing stale on a first load, and say plainly that it failed.
        setNotifications([]);
        setUnreadCount(0);
        setHasMore(false);
        setLoadFailed(true);
      }
      // A silent refresh leaves the list it already has on screen.
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const response = await notificationsApi.getAll({ limit: NOTIFICATIONS_PAGE_SIZE, offset: notifications.length, cacheBust: Date.now() });

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const nextItems = response.data.filter((item) => !existingIds.has(item.id));
        return [...prev, ...nextItems];
      });
      setHasMore(response.data.length === NOTIFICATIONS_PAGE_SIZE);
    } catch {
      // Keep current list usable if pagination fetch fails.
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, notifications.length]);

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
        const existingIndex = prev.findIndex((item) => item.id === notification.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = notification;
          return next;
        }
        return [notification, ...prev];
      });
      if (refetchUnreadCountTimerRef.current) {
        clearTimeout(refetchUnreadCountTimerRef.current);
      }
      refetchUnreadCountTimerRef.current = setTimeout(() => {
        refetchUnreadCountTimerRef.current = null;
        void refetchUnreadCount();
      }, 400);
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
      if (refetchUnreadCountTimerRef.current) {
        clearTimeout(refetchUnreadCountTimerRef.current);
        refetchUnreadCountTimerRef.current = null;
      }
      socket.off('connect', handleSocketConnect);
      socket.off('notifications.new', handleRealtimeNotification);
      manager.off('reconnect', handleSocketReconnect);
      socket.disconnect();
    };
  }, [loadNotifications, refetchUnreadCount]);

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

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      // In the modal layout the shared overlay behaviour owns Escape, so that
      // a dropdown opened inside the panel gets it first.
      if (isModalLayout) return;
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Measure the header rather than assuming its height: it is 64px wide-screen
  // and 112px once the mobile nav row is in it, and that changes on rotation.
  useEffect(() => {
    if (!isOpen) return;

    const measure = () => {
      const header = rootRef.current?.closest('header');
      if (header) {
        setHeaderBottom(Math.round(header.getBoundingClientRect().bottom));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, [isOpen]);

  // Move focus into the panel on open and hand it back to the bell on close.
  useEffect(() => {
    if (!isOpen) return;
    const bell = rootRef.current?.querySelector('button');
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      if (bell instanceof HTMLElement && document.body.contains(bell)) {
        bell.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

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
      setUnreadCount(0);
    } catch {
      // Keep the menu usable even if the read-all endpoint fails.
    } finally {
      setMarkingAllRead(false);
    }
  }, []);

  const handleBellClick = () => {
    const shouldOpen = !isOpen;

    if (shouldOpen) {
      setUnreadAtOpen(
        new Set(notifications.filter((n) => !n.isRead).map((n) => n.id)),
      );
    }

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

  const handleListScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const remaining =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (remaining <= 48) {
        void loadMoreNotifications();
      }
    },
    [loadMoreNotifications],
  );

  return (
    <div
      ref={rootRef}
      className="relative"
      style={{ '--hdr-bottom': `${headerBottom}px` } as React.CSSProperties}
    >
      <button
        type="button"
        onClick={handleBellClick}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-3 transition-all duration-200 hover:bg-surface-2 hover:text-ink-2"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-xs font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Phones only: a scrim so the panel reads as a layer over the page
              and a tap anywhere outside closes it. */}
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            style={{ top: 'var(--hdr-bottom)' }}
            className="fixed inset-x-0 bottom-0 z-[55] bg-[rgba(25,28,27,0.40)] motion-safe:animate-[ovrlapFade_.15s_ease-out] xl:hidden"
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal={isModalLayout ? true : undefined}
            aria-label="Notifications"
            className="fixed inset-x-0 top-[calc(var(--hdr-bottom)+8px)] z-[60] mx-3 flex max-h-[calc(100dvh-var(--hdr-bottom)-env(safe-area-inset-bottom)-24px)] flex-col overflow-hidden outline-none motion-safe:animate-[ovrlapPanelIn_.18s_cubic-bezier(.25,.1,.25,1)] xl:absolute xl:inset-x-auto xl:right-0 xl:top-[calc(100%+10px)] xl:z-50 xl:mx-0 xl:max-h-none xl:w-96 rounded-lg border border-hairline bg-surface shadow-e2 ring-1 ring-black/5">
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">
                Notifications
              </p>
              <p className="text-xs text-ink-3">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
                className={`inline-flex items-center justify-center rounded-full border border-hairline text-ink-3 transition-colors hover:bg-sunken hover:text-ink-2 ${
                  isModalLayout ? 'h-11 w-11' : 'h-8 w-8'
                }`}
                aria-label="Refresh notifications"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                />
              </button>
              {/* As a trapped dialog the panel had no way out but Escape or the
                  scrim, neither of which a touch user can see. */}
              {isModalLayout && (
                <button
                  type="button"
                  onClick={closePanel}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline text-ink-3 transition-colors hover:bg-sunken hover:text-ink-2"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div
            ref={listRef}
            onScroll={handleListScroll}
            className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-3 xl:max-h-96 xl:flex-none"
          >
            {loading ? (
              <p className="px-1 py-4 text-center text-sm text-ink-3">
                Loading notifications...
              </p>
            ) : loadFailed ? (
              <div className="px-1 py-5 text-center" role="alert">
                <p className="text-sm font-semibold text-ink">
                  We couldn&rsquo;t load your notifications
                </p>
                <p className="mt-1 text-sm text-ink-3">
                  The request didn&rsquo;t complete.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void loadNotifications()}
                >
                  Try again
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-ink-3">
                You have no notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border px-3 py-2.5 transition-colors ${
                    unreadAtOpen.has(notification.id) || !notification.isRead
                      ? 'border-accent-soft bg-accent-soft/60'
                      : 'border-hairline bg-sunken'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink line-clamp-2">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-2 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                    {notification.ctaUrl && (
                      <Link
                        href={notification.ctaUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center justify-center rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent-hover shrink-0"
                      >
                        View
                      </Link>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-ink-3">
                    {formatTimestamp(notification.createdAt)}
                  </p>
                </div>
              ))
            )}
            {!loading && loadingMore && (
              <p className="px-1 py-2 text-center text-xs text-ink-3">
                Loading more...
              </p>
            )}
            {!loading && !loadingMore && notifications.length > 0 && !hasMore && (
              <p className="px-1 py-2 text-center text-xs text-ink-3">
                End of notifications
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-hairline px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] xl:pb-3">
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
        </>
      )}
    </div>
  );
}
