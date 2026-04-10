# Server-Side Command Routing Design

**Date:** 2026-04-10
**Scope:** Route WebSocket commands from the web UI through the Dart server to mutate game state

---

## Overview

The web player UI sends granular commands (changeHealth, setInitiative, addXP, addStatusEffect, removeStatusEffect) via WebSocket. Currently the server validates and logs these but doesn't act on them. This spec adds server-side command processing: the server applies field-level mutations to the stored JSON game state and broadcasts the result to all clients (TCP + WebSocket).

---

## Why Server-Side Processing

The Flutter app sends full game state blobs (`Index:N Description:... GameState:{full json}`). The web UI can't safely do the same because:

- Two clients sending full state simultaneously causes last-write-wins data loss
- The web UI only modifies a few fields but would overwrite everything else
- Server-side mutations apply to the latest state, avoiding desync

---

## Architecture

### Current Flow (TCP/Flutter)
```
Flutter app -> full state blob -> Server stores + broadcasts -> all clients
```

### New Flow (WebSocket/Web UI)
```
Web UI -> {"action":"changeHealth","characterId":"Frozen Fist","value":-5}
  -> Server receives JSON via WebSocket
  -> Server loads current state from gameSaveStates.last
  -> Server parses JSON, finds character in currentList by id
  -> Server applies field mutation (health += value)
  -> Server saves new state, increments commandIndex
  -> Server broadcasts updated state to ALL clients (TCP + WebSocket)
```

### Key Principle

The server performs **field-level JSON mutations only**. No game logic, no validation, no clamping. The web UI handles display-side constraints (e.g. health >= 0). The server just applies the delta to the raw JSON.

---

## Supported Commands

| Action | Fields | Mutation |
|--------|--------|----------|
| `changeHealth` | `characterId`, `value` | `characterState.health += value` |
| `setInitiative` | `characterId`, `value` | `characterState.initiative = value` |
| `addXP` | `characterId`, `value` | `characterState.xp += value` |
| `addStatusEffect` | `characterId`, `effect` | Append `effect` to `characterState.conditions` |
| `removeStatusEffect` | `characterId`, `effect` | Remove `effect` from `characterState.conditions` |

---

## Implementation

### Server Changes (Dart)

**New file: `lib/command_processor.dart`**

Responsible for applying a parsed web command to a raw game state JSON string. Returns the modified JSON string.

```
Input:  (Map<String, dynamic> command, String currentStateJson)
Output: String updatedStateJson
```

Steps:
1. Decode `currentStateJson` to a `Map<String, dynamic>`
2. Find the character in `currentList` where `id == command['characterId']`
3. Apply the mutation to `characterState` based on `command['action']`
4. Re-encode to JSON string
5. Return the updated JSON

If the character isn't found or the action is unknown, return the original state unchanged (no-op, log a warning).

**Modified: `lib/websocket_handler.dart`**

Replace the logging-only `_handleMessage` with actual command execution:
1. Parse and validate the message (already done)
2. Call `commandProcessor.apply(command, getCurrentState())`
3. Call a new callback `onCommandProcessed(description, newStateJson)` that the server wires up

**Modified: `lib/main.dart`**

Wire the new callback: when a web command is processed, create a state update message and feed it through `StandaloneServer.updateStateFromMessage()` so it goes through the same save + broadcast path as TCP updates.

### Web UI Changes

None. The web UI already sends the correct message format and does optimistic updates. Once the server processes the command and broadcasts, the web UI will receive the server-confirmed state.

---

## State Update Path

After command processing, the result goes through the existing `updateStateFromMessage` path:

1. `commandProcessor.apply()` returns new JSON
2. Create a `StateUpdateMessage` with `index = currentIndex + 1`, `description`, and the new JSON
3. Call `server.updateStateFromMessage(message, ...)` — but since there's no TCP `Socket` for the web client, we need a variant that broadcasts to ALL clients (not "all except sender")
4. This stores the state, increments the index, and broadcasts via `send()` (which hits TCP clients) + `onStateBroadcast` (which hits WebSocket clients)

Since the web client also receives the broadcast, it will sync to the server-confirmed state, overwriting its optimistic update if they differ.

---

## Edge Cases

**Character not found:** Log warning, no-op. Can happen if the web UI is out of sync.

**Empty state:** If `gameSaveStates.last` is empty (no game running), no-op.

**Concurrent mutations:** Two web commands arriving at the same time are processed sequentially (Dart is single-threaded). No race conditions.

**TCP client sends state while web command is processing:** The TCP update may arrive between the web command being read and the result being saved. Since Dart is single-threaded and processes messages in order, this is safe — the web command will apply to whatever state was current at processing time.

---

## Files Changed

| File | Change |
|------|--------|
| `lib/command_processor.dart` | **New** — apply web commands to JSON state |
| `lib/websocket_handler.dart` | **Modified** — call command processor instead of logging |
| `lib/main.dart` | **Modified** — wire command processor callback to state update path |

---

## Testing

- Unit test `command_processor.dart` with sample game state JSON
- Test each of the 5 commands
- Test character-not-found case
- Test empty state case
- Integration: send WebSocket command, verify state broadcast to TCP + WebSocket clients
