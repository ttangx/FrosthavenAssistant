import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, ServerStateMessage } from '../types';
import { parseServerGameState } from '../utils/serverProtocol';
import { parseStateMessage } from '../utils/stateMessage';

interface UseWebSocketOptions {
  url: string;
  onStateUpdate: (message: ServerStateMessage) => void;
  onMismatch: (message: string) => void;
  onError: (error: string) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (message: any) => void;
}

const MAX_RECONNECT_ATTEMPTS = 12;
const BASE_RECONNECT_DELAY = 500;
const MAX_RECONNECT_DELAY = 30000;
const PING_INTERVAL_MS = 20000; // Send ping every 20s
const PING_TIMEOUT_MS = 10000; // If no pong in 10s, consider dead

/** Exponential backoff with ±25% jitter to prevent thundering herd. */
function calculateBackoff(attempt: number): number {
  const base = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, attempt), MAX_RECONNECT_DELAY);
  const jitter = base * (Math.random() * 0.5 - 0.25); // ±25%
  return Math.max(100, Math.round(base + jitter));
}

export function useWebSocket({
  url,
  onStateUpdate,
  onMismatch,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueueRef = useRef<any[]>([]);

  // Store latest callbacks in refs to avoid stale closures
  const onStateUpdateRef = useRef(onStateUpdate);
  const onMismatchRef = useRef(onMismatch);
  const onErrorRef = useRef(onError);

  useEffect(() => { onStateUpdateRef.current = onStateUpdate; }, [onStateUpdate]);
  useEffect(() => { onMismatchRef.current = onMismatch; }, [onMismatch]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (pingTimeoutRef.current) {
      clearTimeout(pingTimeoutRef.current);
      pingTimeoutRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${url}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        onErrorRef.current('');

        // Flush any queued messages
        const queue = messageQueueRef.current;
        messageQueueRef.current = [];
        for (const msg of queue) {
          try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
        }

        // Start heartbeat pings
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) return;
          // Any message resets the pong timer; here we expect server to send state
          // or we'll close if nothing comes within timeout
          if (pingTimeoutRef.current) clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = setTimeout(() => {
            console.warn('WebSocket: no data received, connection may be dead');
            ws.close();
          }, PING_TIMEOUT_MS);
          // Trigger server activity — the server broadcasts regularly so this isn't strictly needed,
          // but we send a no-op to probe. The server will ignore unknown actions.
          try { ws.send(JSON.stringify({ action: 'ping' })); } catch { /* ignore */ }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event: MessageEvent) => {
        // Any incoming message proves connection is alive — reset pong timer
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }

        const data = String(event.data);
        const stateMessage = parseStateMessage(data);
        if (stateMessage?.mismatch) {
          onMismatchRef.current(data);
        }

        if (stateMessage) {
          if (!stateMessage.stateJson) return;
          try {
            const rawState = JSON.parse(stateMessage.stateJson);
            const gameState: GameState = parseServerGameState(rawState);
            onStateUpdateRef.current({
              index: stateMessage.index,
              description: stateMessage.description,
              gameState,
            });
          } catch (parseError) {
            onErrorRef.current(`Failed to parse server message: ${parseError}`);
          }
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (pingTimeoutRef.current) {
          clearTimeout(pingTimeoutRef.current);
          pingTimeoutRef.current = null;
        }

        // Don't reconnect if offline — wait for online event instead
        if (!navigator.onLine) return;

        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = calculateBackoff(reconnectCountRef.current);
          reconnectCountRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {
        onErrorRef.current('WebSocket connection error');
      };

      wsRef.current = ws;
    } catch (err) {
      onErrorRef.current(`Failed to create WebSocket: ${err}`);
    }
  }, [url]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue for when we reconnect (cap queue at 50 to prevent memory growth)
      if (messageQueueRef.current.length < 50) {
        messageQueueRef.current.push(message);
      }
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, clearTimers]);

  // Reconnect immediately when network comes back online
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network online — reconnecting WebSocket');
      reconnectCountRef.current = 0;
      connect();
    };
    const handleOffline = () => {
      console.log('Network offline');
      setIsConnected(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connect]);

  // Reconnect when app returns to foreground (mobile Safari/Chrome suspend sockets)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Check if connection is still alive; if not, reconnect
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          console.log('App visible — reconnecting WebSocket');
          reconnectCountRef.current = 0;
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [connect]);

  return { isConnected, send };
}
