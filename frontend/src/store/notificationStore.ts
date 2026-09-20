/**
 * notificationStore.ts
 *
 * Zustand store for in-app notifications backed by the REST API.
 * Polls /api/notifications/unread-count/ every 30 s while the user is
 * authenticated, and fetches the full list on demand (e.g. when the bell
 * is clicked).
 */

import { create } from 'zustand';
import { notificationsApi, type AppNotificationItem } from '../lib/api';

interface NotificationState {
  /** Full notification list (loaded when dropdown is opened). */
  notifications: AppNotificationItem[];
  /** Fast badge count, refreshed by polling. */
  unreadCount: number;
  /** Whether the full list is currently being fetched. */
  loading: boolean;
  /** Whether the polling interval is running. */
  polling: boolean;

  // ── Actions ─────────────────────────────────────────────────────────────
  /** Fetch full list + update badge count. */
  fetchNotifications: () => Promise<void>;
  /** Mark specific IDs as read (or all if ids is empty / omitted). */
  markRead: (ids?: number[]) => Promise<void>;
  /** Mark all as read. */
  markAllRead: () => Promise<void>;
  /** Delete all notifications. */
  clearAll: () => Promise<void>;
  /** Start background polling (call after login). */
  startPolling: () => void;
  /** Stop background polling (call after logout). */
  stopPolling: () => void;
}

let _pollInterval: ReturnType<typeof setInterval> | null = null;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  polling: false,

  // ──────────────────────────────────────────────────────────────────────────
  // fetchNotifications
  // ──────────────────────────────────────────────────────────────────────────
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await notificationsApi.list();
      const items = res.data;
      const unread = items.filter((n) => !n.is_read).length;
      set({ notifications: items, unreadCount: unread, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // markRead
  // ──────────────────────────────────────────────────────────────────────────
  markRead: async (ids?: number[]) => {
    try {
      if (ids && ids.length > 0) {
        await notificationsApi.markRead(ids);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - ids.length),
        }));
      } else {
        await notificationsApi.markAllRead();
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
          unreadCount: 0,
        }));
      }
    } catch {
      // silent — badge will self-correct on next poll
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // markAllRead
  // ──────────────────────────────────────────────────────────────────────────
  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silent
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // clearAll
  // ──────────────────────────────────────────────────────────────────────────
  clearAll: async () => {
    try {
      await notificationsApi.clearAll();
      set({ notifications: [], unreadCount: 0 });
    } catch {
      // silent
    }
  },

  // ──────────────────────────────────────────────────────────────────────────
  // startPolling — lightweight: only fetches the unread count every 30 s
  // ──────────────────────────────────────────────────────────────────────────
  startPolling: () => {
    if (_pollInterval) return; // already running

    // Fetch immediately on start
    notificationsApi
      .unreadCount()
      .then((res) => set({ unreadCount: res.data.count }))
      .catch(() => {});

    _pollInterval = setInterval(() => {
      notificationsApi
        .unreadCount()
        .then((res) => set({ unreadCount: res.data.count }))
        .catch(() => {});
    }, 30_000);

    set({ polling: true });
  },

  // ──────────────────────────────────────────────────────────────────────────
  // stopPolling
  // ──────────────────────────────────────────────────────────────────────────
  stopPolling: () => {
    if (_pollInterval) {
      clearInterval(_pollInterval);
      _pollInterval = null;
    }
    set({ polling: false, notifications: [], unreadCount: 0 });
  },
}));
