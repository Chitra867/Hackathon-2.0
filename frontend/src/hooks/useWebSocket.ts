import { useEffect, useRef, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import type { Notification } from '../types';

interface UseWebSocketOptions {
  hospitalId?: number;
  onMessage?: (notification: Notification) => void;
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
  const { connect, disconnect, isConnected, addNotification } = useNotificationStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const createConnection = useCallback(() => {
    if (!isAuthenticated() || !mountedRef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const wsPort = import.meta.env.DEV ? ':8000' : '';
    const wsPath = hospitalId ? `/ws/hospital/${hospitalId}/` : '/ws/notifications/';
    const wsUrl = `${wsProtocol}://${wsHost}${wsPort}${wsPath}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event: MessageEvent) => {
      try {
        const notification = JSON.parse(event.data as string) as Notification;
        addNotification(notification);
        onMessage?.(notification);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      // Schedule reconnect
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          createConnection();
        }
      }, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [hospitalId, onMessage, isAuthenticated, addNotification]);

  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    createConnection();
  }, [createConnection]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect && isAuthenticated()) {
      connect(hospitalId);
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [autoConnect, hospitalId, isAuthenticated, connect, disconnect]);

  return { isConnected, send, reconnect };
}
