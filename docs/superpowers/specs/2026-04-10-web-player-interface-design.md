# Web Player Interface Design

**Date:** 2026-04-10  
**Scope:** Companion web interface for individual player control in Frosthaven Assistant  
**Audience:** 2-4 players using phones/tablets alongside the main Flutter app on a shared TV display

---

## Overview

Build a web-based player interface that allows individual players to input and track their character metrics (initiative, health, XP, statuses) in real-time while the main Flutter app displays the shared game state on a TV. The web UI acts as a companion tool for active player input, not a replacement for the TV app.

---

## Core Use Cases

1. **Character Selection:** Player opens web URL, selects their character from the current scenario
2. **Initiative Entry:** Before round starts, player enters their character's initiative via numeric input
3. **In-Combat Tracking:** Player modifies health, XP, and status effects during the round
4. **Turn Order Awareness:** After round starts, player sees initiative order and knows when their turn is
5. **State Sync:** All changes optimistically update locally, sync to server, broadcast to all connected clients

---

## Architecture

### Server-Side Changes (Dart)

**Add WebSocket support to `frosthaven_assistant_server`:**
- Use `shelf` package to create an HTTP server with WebSocket upgrade capability
- Listen on a new endpoint (e.g., `/ws`) alongside existing TCP socket on port 4567
- Convert incoming WebSocket JSON messages to the existing text protocol: `Index:...Description:...GameState:...`
- Route messages through the same broadcasting system that TCP clients use
- Both TCP and WebSocket clients receive identical state broadcasts

**No changes required to:**
- Game logic (commands, state management)
- Flutter app's server implementation
- Existing client protocol

### Client-Side Architecture (React Web App)

**Entry Point:**
- New separate web app (can live in the repo or as a separate project)
- Serves on a different port than the Flutter server
- No authentication needed (assumes LAN/local network or trusted internet access)

**Core Components:**
1. **Character Selection Screen**
   - List all available characters from current scenario
   - Tap to select → enter character view
   - Disconnect button to deselect and choose different character

2. **Character Sheet View** (main persistent view)
   - **Header:** Character name, class icon, current level
   - **Initiative Section:**
     - Before round: Large numeric input field + software numpad
     - After round: Read-only display
     - Turn order list below showing all combatants in initiative order
     - Current active turn highlighted
   - **Health Section:**
     - Current/Max health display
     - Buttons: ±1, ±5 damage taken
     - Direct input field for quick adjustment
   - **Experience Section:**
     - Current/Max XP display
     - Button to add earned XP
   - **Status Effects Section:**
     - List of available conditions (poisoned, weakened, etc.)
     - Tap to toggle on/off for this character
   - **Summons Section** (if in scope)
     - List active summons
     - Button to add/remove summons
   - **Read-Only Info**
     - Round number (synced from server)
     - Scenario name and difficulty modifiers
     - Not editable by player

3. **Connection Status**
   - "Connected" indicator when WebSocket is live
   - "Disconnected" banner with auto-reconnect status if connection lost

**State Management:**
- Local React state mirrors server state
- WebSocket listener updates local state on incoming broadcasts
- User actions optimistically update local state, then send to server
- Server broadcast confirms or corrects local state

---

## Communication Protocol

### WebSocket Message Format

**Client → Server (JSON):**
```json
{
  "action": "changeHealth",
  "characterId": "barbarian_1",
  "value": -5,
  "operationType": "damage"  // or "heal"
}
```

```json
{
  "action": "setInitiative",
  "characterId": "barbarian_1",
  "value": 18
}
```

```json
{
  "action": "addStatusEffect",
  "characterId": "barbarian_1",
  "effect": "poisoned"
}
```

```json
{
  "action": "selectCharacter",
  "characterId": "barbarian_1"
}
```

**Server → Client (text protocol, same as existing):**
```
Index:42Description:Barbarian took 5 damageGameState:{"characters":[...]}
```

Dart server:
1. Receives JSON from WebSocket
2. Maps to Command class (e.g., `ChangeHealthCommand`)
3. Executes through existing game state system
4. Broadcasts new state as text protocol to all clients (TCP + WebSocket)

### Connection Flow

```
Player opens web URL
  → Page loads, shows character list
  → Player selects character
  → Client sends: {"action": "selectCharacter", "characterId": "xxx"}
  → Server applies logic, broadcasts state
  → Web client receives update, subscribes to that character's changes
  → WebSocket listener keeps syncing state in real-time
```

---

## UI Details

### Character Sheet Layout

**Mobile (Portrait):**
- Single column, full width
- Stacked sections: initiative → health → XP → statuses → summons
- Large touch targets (40px+ buttons)
- Initiative input field spans full width

**Tablet (Landscape):**
- Two-column layout if screen allows
- Initiative and turn order on left
- Health/XP/statuses on right
- Better use of horizontal space

### Initiative Workflow

**Pre-Round:**
1. Large text input: "Enter your initiative"
2. Virtual numpad below (if needed for accessibility)
3. Submit button or auto-submit on complete entry
4. Once sent, shows as large badge

**Post-Round (Round Started):**
1. Initiative becomes read-only badge
2. Below: "Turn Order" section
   - List all characters + monsters in initiative order
   - Highlight current active turn (bold, different color, maybe pulsing)
   - Show who's next
   - Updates in real-time as turns progress

### Status Effects Display

- Available conditions (poisoned, weakened, bleeding, etc.) shown as badges/pills
- Tap to toggle active/inactive for this character
- Visual indicator (color, checkmark) shows which are active
- Only show conditions relevant to current game (from scenario rules)

### Sync Indicators

- "Synced ✓" or timestamp of last sync
- Show if waiting for server confirmation
- "Reconnecting..." during connection loss

---

## Visual Design & Aesthetic

**Theme:** Frosthaven ice aesthetic (cool tones, blues, whites, frosted glass effects)

- **Color Palette:** Blues, whites, icy grays (match the Frosthaven theme in the Flutter app, not the dark red Gloomhaven theme)
- **Background:** Cool-toned, possibly translucent/frosted glass effect on cards
- **Text:** High contrast on cool backgrounds for readability
- **Accents:** Icy blues and whites for interactive elements
- **Typography:** Match the app's existing font choices where possible
- **Cards/Sections:** Subtle borders or frosted appearance to separate UI regions
- **Status Effects:** Color-coded badges (e.g., red for damage, blue for cold effects, etc.)

The web UI should feel like a companion tool that visually belongs with the main Frosthaven app, not a generic web interface.

---

## Real-Time Sync Behavior

### Normal Flow (Happy Path)

1. Player taps "take 5 damage"
2. **Immediately:** Local health decreases by 5 (optimistic)
3. **In background:** JSON message sent via WebSocket
4. **Server receives:** Executes `ChangeHealthCommand`, broadcasts new state
5. **All clients receive:** New state with updated index
6. **Web client updates:** Syncs to server state (already matches local)

### Connection Loss

- **Detect:** WebSocket `onclose` event
- **Behavior:** Show "Disconnected" banner, disable inputs
- **Recovery:** Attempt reconnect every 3 seconds with exponential backoff
- **Reconnect success:** Request full state sync, update UI
- **Stale local changes:** Server state overwrites (acceptable with trusted players)

### State Mismatch (Rare)

- Server sends `Mismatch:Index:...` if client index is out of sync
- Client immediately resets to server state
- UI updates to reflect server truth
- With trusted players, this should be extremely rare

---

## Scope: In vs Out

### In Scope
- Initiative entry and display
- Health modification (damage/heal)
- XP tracking
- Status effects (toggle on/off)
- Basic turn order display
- Real-time sync with WebSocket
- Two-way updates (client → server → all clients)
- Optimistic UI updates
- Connection status indication
- Character selection UI

### Out of Scope (for v1)
- Advanced summon management (beyond basic add/remove if included)
- Modifier deck display
- Ability cards
- Loot deck interaction
- Campaign progression
- Character creation/leveling
- Multi-scenario persistence
- Authentication/authorization (assumes trusted LAN/local)

---

## Tech Stack

### Frontend
- **Framework:** React 18+
- **Language:** TypeScript (or JavaScript if preferred)
- **Build:** Vite or Create React App
- **WebSocket Client:** Native `WebSocket` API or lightweight library
- **Styling:** CSS-in-JS or CSS modules (simple, responsive)
- **State:** React hooks (no Redux needed for this scope)
- **Deploy:** Static hosting (Vercel, GitHub Pages, or served from project)

### Backend
- **Language:** Dart (existing)
- **Package:** `shelf` (HTTP + WebSocket support)
- **Port:** 4567 (same as existing TCP server)
- **Protocol:** HTTP upgrade to WebSocket

---

## Implementation Phases

1. **Phase 1: WebSocket Server**
   - Add `shelf` to `frosthaven_assistant_server/pubspec.yaml`
   - Create WebSocket handler that accepts connections
   - Convert JSON messages to text protocol
   - Test with simple WebSocket client

2. **Phase 2: Basic Web UI**
   - Set up React project
   - Character selection screen
   - Basic character sheet layout
   - Local state management
   - WebSocket connection

3. **Phase 3: Core Features**
   - Initiative input + display
   - Health modification
   - XP tracking
   - Status effects
   - Turn order display
   - Optimistic updates

4. **Phase 4: Polish & Edge Cases**
   - Connection loss handling
   - State mismatch recovery
   - Responsive design refinement
   - Sync indicators
   - Error messages

---

## Testing Strategy

### Server-Side (Dart)
- Unit tests for WebSocket message parsing
- Integration tests with mock WebSocket clients
- Verify state broadcast to multiple simultaneous WebSocket connections
- Test message protocol conversion (JSON → text)

### Client-Side (React)
- Unit tests for component state updates
- Integration tests for WebSocket connection/reconnection
- Test optimistic updates with delayed server confirmation
- Test state mismatch recovery

### End-to-End
- Run standalone server, open multiple web clients
- Verify changes on one client appear on all others
- Test disconnection and reconnection
- Verify TV app and web clients stay in sync

---

## Success Criteria

- ✓ Players can select their character from the web UI
- ✓ Initiative entry is prominent and quick to use
- ✓ Health, XP, and status changes sync instantly to server and other clients
- ✓ Turn order updates in real-time as round progresses
- ✓ Connection loss doesn't break the game; auto-reconnect works
- ✓ Web UI works on phone and tablet
- ✓ TV app and web clients stay perfectly in sync
