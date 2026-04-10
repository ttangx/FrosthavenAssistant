# Command Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route WebSocket commands from the web UI through the Dart server to mutate game state and broadcast to all clients.

**Architecture:** New `command_processor.dart` applies field-level JSON mutations to stored game state. WebSocket handler calls the processor, then feeds the result through the existing state update + broadcast path. No game logic — just JSON field writes.

**Tech Stack:** Dart, dart:convert for JSON manipulation

---

## File Structure

```
frosthaven_assistant_server/
├── lib/
│   ├── command_processor.dart     (NEW — apply web commands to JSON state)
│   ├── websocket_handler.dart     (MODIFY — call command processor)
│   └── main.dart                  (MODIFY — wire processor callback)
```

---

### Task 1: Create command_processor.dart

**Files:**
- Create: `frosthaven_assistant_server/lib/command_processor.dart`

- [ ] **Step 1: Create the command processor**

```dart
import 'dart:convert';

/// Applies a web command to the current game state JSON.
///
/// Returns the modified JSON string, or null if the state
/// could not be modified (empty state, character not found, etc).
String? applyCommand(Map<String, dynamic> command, String currentStateJson) {
  if (currentStateJson.isEmpty) {
    print('Command processor: no game state to modify');
    return null;
  }

  final Map<String, dynamic> state;
  try {
    state = jsonDecode(currentStateJson) as Map<String, dynamic>;
  } catch (e) {
    print('Command processor: failed to parse game state: $e');
    return null;
  }

  final currentList = state['currentList'] as List<dynamic>?;
  if (currentList == null) {
    print('Command processor: no currentList in game state');
    return null;
  }

  final characterId = command['characterId'] as String;
  final action = command['action'] as String;

  // Find the character in currentList by id
  final characterIndex = currentList.indexWhere(
    (item) => item is Map<String, dynamic> && item['id'] == characterId,
  );

  if (characterIndex == -1) {
    print('Command processor: character "$characterId" not found');
    return null;
  }

  final character = currentList[characterIndex] as Map<String, dynamic>;
  final characterState = character['characterState'] as Map<String, dynamic>?;
  if (characterState == null) {
    print('Command processor: character "$characterId" has no characterState');
    return null;
  }

  switch (action) {
    case 'changeHealth':
      final value = command['value'] as num;
      final currentHealth = (characterState['health'] as num?) ?? 0;
      characterState['health'] = currentHealth + value;

    case 'setInitiative':
      final value = command['value'] as num;
      characterState['initiative'] = value;

    case 'addXP':
      final value = command['value'] as num;
      final currentXP = (characterState['xp'] as num?) ?? 0;
      characterState['xp'] = currentXP + value;

    case 'addStatusEffect':
      final effect = command['effect'] as String;
      final conditions = characterState['conditions'] as List<dynamic>? ?? [];
      if (!conditions.contains(effect)) {
        conditions.add(effect);
        characterState['conditions'] = conditions;
      }

    case 'removeStatusEffect':
      final effect = command['effect'] as String;
      final conditions = characterState['conditions'] as List<dynamic>? ?? [];
      conditions.remove(effect);
      characterState['conditions'] = conditions;

    default:
      print('Command processor: unknown action "$action"');
      return null;
  }

  return jsonEncode(state);
}
```

- [ ] **Step 2: Commit**

```bash
git add frosthaven_assistant_server/lib/command_processor.dart
git commit -m "feat: add command processor for web UI actions"
```

---

### Task 2: Add applyWebCommand method to StandaloneServer

The `updateStateFromMessage` method requires a `Socket` (TCP client) to know who NOT to echo back to. For web commands, we want to broadcast to ALL clients. Add a method that processes a web command and broadcasts the result.

**Files:**
- Modify: `frosthaven_assistant_server/lib/standalone_server.dart`

- [ ] **Step 1: Add import and method**

Add at top of file:
```dart
import 'package:frosthaven_assistant_server/command_processor.dart';
```

Add this method to the `StandaloneServer` class:

```dart
  /// Apply a web command to the current game state and broadcast the result.
  /// Returns true if the command was applied successfully.
  bool applyWebCommand(Map<String, dynamic> command, String description) {
    final currentState = _state.gameSaveStates.isNotEmpty
        ? _state.gameSaveStates.last!.getState()
        : '';

    final newState = applyCommand(command, currentState);
    if (newState == null) {
      return false;
    }

    // Save the new state (same path as TCP updateStateFromMessage)
    _state.commandIndex++;
    _state.commandDescriptions.insert(_state.commandIndex, description);
    _state.save(newState);

    // Broadcast to ALL clients (TCP + WebSocket via onStateBroadcast)
    final message = "Index:${_state.commandIndex}Description:${description}GameState:${_state.gameSaveStates.last!.getState()}";
    send(message);

    print('Web command applied: $description (index: ${_state.commandIndex})');
    return true;
  }
```

- [ ] **Step 2: Commit**

```bash
git add frosthaven_assistant_server/lib/standalone_server.dart
git commit -m "feat: add applyWebCommand to StandaloneServer"
```

---

### Task 3: Wire WebSocket handler to command processor

**Files:**
- Modify: `frosthaven_assistant_server/lib/websocket_handler.dart`
- Modify: `frosthaven_assistant_server/lib/main.dart`

- [ ] **Step 1: Add command callback to WebSocketHandler**

In `websocket_handler.dart`, add a callback field and replace the logging-only code:

Add field to the class:
```dart
  /// Called when a validated command should be applied to game state.
  /// Receives the parsed command map and a human-readable description.
  /// Returns true if the command was applied.
  bool Function(Map<String, dynamic> command, String description)? onCommand;
```

Replace the block at lines 72-76 (the logging-only section):
```dart
      final description = describeAction(message);
      print('Web action: $description');

      // Full command routing will be added in a later phase.
      // For now, we log the validated action.
```

With:
```dart
      final description = describeAction(message);

      if (onCommand != null) {
        final applied = onCommand!(message, description);
        if (!applied) {
          print('Web command not applied: $description');
        }
      } else {
        print('Web action (no handler): $description');
      }
```

- [ ] **Step 2: Wire in main.dart**

In `main.dart`, after the existing `server.onStateBroadcast` line, add:

```dart
  // Route web commands through the server's command processor.
  wsHandler.onCommand = (command, description) {
    return server.applyWebCommand(command, description);
  };
```

- [ ] **Step 3: Commit**

```bash
git add frosthaven_assistant_server/lib/websocket_handler.dart frosthaven_assistant_server/lib/main.dart
git commit -m "feat: wire WebSocket commands to server state processing"
```

---

### Task 4: Deploy and test end-to-end

**Files:**
- No new files

- [ ] **Step 1: Push to GitHub**

```bash
git push mine feature/web-player-ui
```

- [ ] **Step 2: Deploy updated server via SSM**

```bash
aws ssm send-command \
  --instance-ids <INSTANCE_ID> \
  --document-name AWS-RunShellScript \
  --parameters '{"commands":["#!/bin/bash","set -eux","export HOME=/root","export PUB_CACHE=/root/.pub-cache","systemctl stop frosthaven-server || true","cd /tmp","rm -rf FrosthavenAssistant","git clone --depth 1 --branch feature/web-player-ui https://github.com/ttangx/FrosthavenAssistant.git","cd FrosthavenAssistant/frosthaven_assistant_server","/opt/dart-sdk/bin/dart pub get","/opt/dart-sdk/bin/dart compile exe lib/main.dart -o /opt/frosthaven/server","systemctl start frosthaven-server","rm -rf /tmp/FrosthavenAssistant","echo Done"]}'
```

- [ ] **Step 3: Test with live game**

1. Open web UI at `http://fh.epicbroccoli.com`
2. Select a character
3. Tap +1 XP — verify the XP counter updates on BOTH the web UI and the Flutter app on the TV
4. Tap -1 health — verify health updates on both
5. Set initiative — verify it appears on both
6. Toggle a condition — verify it appears on both

- [ ] **Step 4: Commit any fixes**

---

## Self-Review

**Spec coverage:**
- changeHealth ✓ (Task 1)
- setInitiative ✓ (Task 1)
- addXP ✓ (Task 1)
- addStatusEffect ✓ (Task 1)
- removeStatusEffect ✓ (Task 1)
- Server applies to latest state ✓ (Task 2)
- Broadcasts to all clients ✓ (Task 2, via `send()` + `onStateBroadcast`)
- Character not found = no-op ✓ (Task 1)
- Empty state = no-op ✓ (Task 1)

**Type consistency:** `applyCommand` takes `Map<String, dynamic>` and `String`, returns `String?`. `applyWebCommand` takes `Map<String, dynamic>` and `String`, returns `bool`. `onCommand` callback matches `applyWebCommand` signature.

---
