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
    >
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {error && <span> - {error}</span>}
    </div>
  );
}
