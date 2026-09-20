import { useEffect, useRef, useCallback, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

export interface AppNotification {
  id: string;
  timestamp: string;
  read: boolean;
  type: 'availability' | 'info';
  title: string;
  message: string;
  data?: unknown;
}

interface UseWebSocketOptions {
  hospitalId?: number;
  onMessage?: (notification: AppNotification) => void;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (data: unknown) => void;
  reconnect: () => void;
}

export function useWebSocket(
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const { hospitalId, onMessage, autoConnect = true } = options;

  const { isAuthenticated } = useAuthStore();
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications
  );

  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  const createConnection = useCallback(() => {
    if (!mountedRef.current || !isAuthenticated()) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Connect to the backend, not the Vercel frontend domain.
    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || window.location.origin;

    const wsUrl = new URL(apiBaseUrl, window.location.origin);
    wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl.pathname = hospitalId
      ? `/ws/hospital/${hospitalId}/`
      : '/ws/notifications/';
    wsUrl.search = '';
    wsUrl.searchParams.set('token', token);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      if (mountedRef.current && wsRef.current === ws) {
        setIsConnected(true);
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!onMessage) return;
      try {
        const data = JSON.parse(event.data as string);

        const notification: AppNotification = {
          id: '',
          timestamp: new Date().toISOString(),
          read: false,
          type: data.type === 'availability_update'
            ? 'availability'
            : 'info',
          title: data.title || 'Update',
          message: data.message || JSON.stringify(data),
          timestamp: new Date().toISOString(),
          read: false,
          data,
        };

        // The REST API remains the source of truth for the notification list.
        void fetchNotifications();
        onMessage?.(notification);
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onclose = () => {
      // Ignore the close event from a connection we already replaced.
      if (wsRef.current !== ws) return;

      wsRef.current = null;

      if (!mountedRef.current) return;

      setIsConnected(false);

      if (autoConnect && isAuthenticated()) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          createConnection();
        }, 30_000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [
    hospitalId,
    onMessage,
    autoConnect,
    isAuthenticated,
    fetchNotifications,
  ]);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const previousWs = wsRef.current;
    wsRef.current = null;

    if (previousWs) {
      previousWs.onclose = null;
      previousWs.close();
    }

    setIsConnected(false);
    createConnection();
  }, [createConnection]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      createConnection();
    }

    return () => {
      mountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const ws = wsRef.current;
      wsRef.current = null;

      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [autoConnect, createConnection]);

  return { isConnected, send, reconnect };
}
