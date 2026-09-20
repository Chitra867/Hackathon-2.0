/**
 * useWebSocket.ts
 *
 * Low-level WebSocket hook for real-time hospital/notification updates.
 * The notification store now uses REST polling; this hook is available for
 * components that need a direct WebSocket connection (e.g. hospital-admin
 * live availability panel).
 *
 * NOTE: This hook is self-contained. It does NOT depend on notificationStore
 * so it stays compatible regardless of store changes.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export interface AppNotification {
  id: string;
  type: 'availability' | 'referral' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
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

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { hospitalId, onMessage, autoConnect = true } = options;
  const { isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const connectedRef = useRef(false);

  const createConnection = useCallback(() => {
    if (!isAuthenticated() || !mountedRef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname;
    const isDev = window.location.port === '3000' || window.location.port === '5173';
    const wsPort = isDev ? ':8000' : '';
    const wsPath = hospitalId ? `/ws/hospital/${hospitalId}/` : '/ws/notifications/';
    const wsUrl = `${wsProtocol}://${wsHost}${wsPort}${wsPath}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      connectedRef.current = true;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!onMessage) return;
      try {
        const data = JSON.parse(event.data as string);
        const notification: AppNotification = {
          id: String(data.id ?? Date.now()),
          type: data.type === 'availability_update' ? 'availability' : 'info',
          title: data.title || 'Update',
          message: data.message || JSON.stringify(data),
          timestamp: new Date().toISOString(),
          read: false,
          data,
        };
        onMessage(notification);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      connectedRef.current = false;
      if (!mountedRef.current) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) createConnection();
      }, 5000);
    };

    ws.onerror = () => { ws.close(); };
  }, [hospitalId, onMessage, isAuthenticated]);

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
    if (autoConnect && isAuthenticated()) createConnection();
    return () => {
      mountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, hospitalId]);

  return {
    isConnected: connectedRef.current,
    send,
    reconnect,
  };
}
