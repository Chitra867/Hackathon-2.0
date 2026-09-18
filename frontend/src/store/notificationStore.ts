import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'referral' | 'availability' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

interface NotificationState {
  notifications: AppNotification[];
  wsConnected: boolean;
  wsSocket: WebSocket | null;

  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
  connect: (hospitalId?: number) => void;
  disconnect: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  wsConnected: false,
  wsSocket: null,

  addNotification: (n) => {
    const notification: AppNotification = {
      ...n,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({ notifications: [notification, ...state.notifications].slice(0, 50) }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearAll: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  connect: (hospitalId?: number) => {
    const { wsSocket } = get();
    if (wsSocket) wsSocket.close();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const path = hospitalId
      ? `${protocol}//${window.location.hostname}:8000/ws/availability/${hospitalId}/`
      : `${protocol}//${window.location.hostname}:8000/ws/availability/`;

    try {
      const ws = new WebSocket(path);

      ws.onopen = () => set({ wsConnected: true });
      ws.onclose = () => set({ wsConnected: false, wsSocket: null });

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'availability_update') {
            get().addNotification({
              type: 'availability',
              title: 'Availability Updated',
              message: `${data.hospital_name}: ${data.availability_type} is now ${data.status}`,
              data,
            });
          } else if (data.type === 'referral_update') {
            get().addNotification({
              type: 'referral',
              title: 'Referral Update',
              message: `Referral ${data.referral_code} status: ${data.status}`,
              data,
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      set({ wsSocket: ws });
    } catch {
      // WS not available in dev without backend
    }
  },

  disconnect: () => {
    const { wsSocket } = get();
    if (wsSocket) {
      wsSocket.close();
    }
    set({ wsConnected: false, wsSocket: null });
  },
}));
