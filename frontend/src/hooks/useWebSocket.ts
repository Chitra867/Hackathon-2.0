import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore, type AppNotification } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

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

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { hospitalId, onMessage, autoConnect = true } = options;
  const { isAuthenticated } = useAuthStore();
  const { connect, disconnect, wsConnected, addNotification } = useNotificationStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const createConnection = useCallback(() => {
    if (!isAuthenticated() || !mountedRef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const isDev = window.location.port === '3000';
    const wsPort = isDev ? ':8000' : '';
    const wsPath = hospitalId ? `/ws/hospital/${hospitalId}/` : '/ws/notifications/';
    const wsUrl = `${wsProtocol}://${wsHost}${wsPort}${wsPath}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string);
        const notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'> = {
          type: data.type === 'availability_update' ? 'availability' : 'info',
          title: data.title || 'Update',
          message: data.message || JSON.stringify(data),
          data,
        };
        addNotification(notification);
        if (onMessage) {
          onMessage({ ...notification, id: '', timestamp: '', read: false });
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) createConnection();
      }, 5000);
    };

    ws.onerror = () => { ws.close(); };
  }, [hospitalId, onMessage, isAuthenticated, addNotification]);

  const reconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    createConnection();
  }, [createConnection]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (autoConnect && isAuthenticated()) connect(hospitalId);
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      disconnect();
    };
  }, [autoConnect, hospitalId, isAuthenticated, connect, disconnect]);

  return { isConnected: wsConnected, send, reconnect };
}
