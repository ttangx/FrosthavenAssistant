import { useCallback, useEffect, useRef, useState } from 'react';
import { GameState, ServerStateMessage } from '../types';
import { parseServerGameState } from '../utils/serverProtocol';

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

const MESSAGE_REGEX = /Index:(-?\d+)Description:(.*?)GameState:(.*)$/s;
const MISMATCH_PREFIX = 'Mismatch:';
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

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

  // Store latest callbacks in refs to avoid stale closures
  const onStateUpdateRef = useRef(onStateUpdate);
  const onMismatchRef = useRef(onMismatch);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onStateUpdateRef.current = onStateUpdate;
  }, [onStateUpdate]);

  useEffect(() => {
    onMismatchRef.current = onMismatch;
  }, [onMismatch]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const ws = new WebSocket(`${protocol}://${url}/ws`);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        onErrorRef.current('');  // Clear any previous error
      };

      ws.onmessage = (event: MessageEvent) => {
        const data = String(event.data);

        if (data.startsWith(MISMATCH_PREFIX)) {
          onMismatchRef.current(data);
          return;
        }

        const match = data.match(MESSAGE_REGEX);
        if (match) {
          const stateJson = match[3];
          if (!stateJson) {
            // Server has no active game state (e.g. index -1, empty state)
            return;
          }
          try {
            const index = parseInt(match[1], 10);
            const description = match[2];
            const rawState = JSON.parse(stateJson);
            const gameState = parseServerGameState(rawState);
            onStateUpdateRef.current({ index, description, gameState });
          } catch (parseError) {
            onErrorRef.current(`Failed to parse server message: ${parseError}`);
          }
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, reconnectCountRef.current),
            MAX_RECONNECT_DELAY,
          );
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
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // Prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { isConnected, send };
}
