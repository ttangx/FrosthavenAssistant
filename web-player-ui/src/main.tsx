import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/theme.css'

// Send uncaught errors to the server via WebSocket
function reportError(error: string, stack?: string) {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'clientError',
        error,
        stack: stack ?? '',
        userAgent: navigator.userAgent,
      }));
      ws.close();
    };
  } catch { /* don't crash the error reporter */ }
}

window.addEventListener('error', (event) => {
  reportError(event.message, event.error?.stack);
});

window.addEventListener('unhandledrejection', (event) => {
  reportError(String(event.reason), event.reason?.stack);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
