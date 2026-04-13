interface ConnectionStatusProps {
  isConnected: boolean;
  error: string | null;
}

export default function ConnectionStatus({
  isConnected,
  error,
}: ConnectionStatusProps) {
  return (
    <div
      className={`status-bar ${isConnected ? 'status-bar--connected' : 'status-bar--disconnected'}`}
      role="status"
      aria-live="polite"
    >
      <style>{`
        .connection-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .connection-dot--connected {
          background-color: var(--color-healing);
        }

        .connection-dot--disconnected {
          background-color: var(--color-damage);
          animation: blink 1.5s ease-in-out infinite;
        }

        .connection-label {
          font-weight: 600;
        }

        .connection-error {
          font-weight: 400;
          opacity: 0.85;
          margin-left: auto;
          font-size: 0.8rem;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <span
        className={`connection-dot ${isConnected ? 'connection-dot--connected' : 'connection-dot--disconnected'}`}
      />
      <span className="connection-label">
        {isConnected
          ? 'Connected'
          : navigator.onLine
            ? 'Reconnecting…'
            : 'Offline'}
      </span>
      {error && <span className="connection-error">{error}</span>}
    </div>
  );
}
