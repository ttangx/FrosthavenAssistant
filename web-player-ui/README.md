# Frosthaven Web Player UI

A companion web interface that lets individual players manage their Frosthaven character during a game session. It connects to the Frosthaven Assistant game server via WebSocket for real-time synchronization.

## Quick Start

### Requirements

- Node.js 18+
- npm 9+
- A running Frosthaven Assistant game server (Dart backend on port 4568)

### Install and Run

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Open it in a browser on your phone or tablet.

### Connect to the Game Server

1. Launch Frosthaven Assistant on the host device.
2. Open the web player UI in a browser.
3. If the server is on the same machine, it connects automatically to `localhost:4568`.
4. If the server is on another device, enter its IP address in the Server Settings field (e.g. `192.168.1.100:4568`).
5. Select your character from the list.

## Features

- Set and view initiative with turn order display
- Track health with quick-adjust buttons and a health bar
- Track experience points
- Toggle status effects / conditions
- Real-time sync with the game server via WebSocket
- Frosthaven ice theme with frosted-glass card styling
- Mobile-first responsive layout

## Architecture

- **Frontend:** React 18 + TypeScript, bundled with Vite
- **Backend:** Dart WebSocket server provided by Frosthaven Assistant, default port 4568
- **State management:** Custom hooks (`useGameState`, `useWebSocket`) with optimistic updates
- **Styling:** CSS custom properties with a shared theme; no external UI library

### Key Directories

```
src/
  components/   UI components (CharacterSheet, HealthSection, etc.)
  hooks/        useGameState, useWebSocket
  styles/       theme.css
  types/        TypeScript type definitions
```

## Server Connection

The web player communicates with the Frosthaven Assistant server over a WebSocket connection.

- **Default address:** `localhost:4568`
- **Changing the address:** Enter a new address in the Server Settings input on the character selection screen, or on the initial connecting screen. Use the format `host:port` (e.g. `192.168.1.50:4568`).
- The connection status indicator at the top of the screen shows whether you are connected (green) or disconnected (red).

## Troubleshooting

**No characters appear after connecting**
- Verify the Frosthaven Assistant game server is running and a scenario is active.
- Check that the server address is correct and the device can reach it on the network.

**Changes not syncing**
- Check the connection status indicator. If it shows disconnected, the WebSocket may have dropped.
- The client reconnects automatically. If the problem persists, reload the page.
- Ensure only one browser tab is controlling the same character.

## Production Build

```bash
npm run build
```

Output is written to `dist/`. Serve it with any static file server.
