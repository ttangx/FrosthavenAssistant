# EC2 Protocol Integration and Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the merged web player and server interoperable, deploy the exact revision safely to the existing ARM64 EC2 host, and leave it running after acceptance.

**Architecture:** A focused TypeScript parser accepts canonical JSON and legacy state envelopes. The Dart server emits JSON consistently and exposes one state-extraction helper for push processing. Production deployment builds the pushed SHA on EC2, stages artifacts, swaps them with backups, and rolls back on any failed check.

**Tech Stack:** TypeScript, React, Vitest, Dart 3, Shelf WebSocket, systemd, Caddy, AWS EC2/SSM

**Spec:** `docs/superpowers/specs/2026-08-23-ec2-protocol-deployment-design.md`

## Global Constraints

- JSON state envelopes are canonical; legacy text envelopes remain read-compatible only.
- Preserve `/opt/frosthaven/vapid.json`, `/opt/frosthaven/node_modules`, Caddy configuration, and the existing systemd unit.
- Deploy and verify one exact Git SHA on native Linux ARM64.
- Roll back automatically if any production acceptance check fails.
- Leave the EC2 instance running only after clean acceptance evidence.

---

### Task 1: Web state-message parser

**Files:**
- Create: `web-player-ui/src/utils/stateMessage.ts`
- Create: `web-player-ui/src/utils/stateMessage.test.ts`
- Modify: `web-player-ui/src/hooks/useWebSocket.ts`
- Modify: `web-player-ui/package.json`
- Modify: `web-player-ui/package-lock.json`

**Interfaces:**
- Produces: `parseStateMessage(data: string): ParsedStateMessage | null`
- `ParsedStateMessage` contains `index`, `description`, `stateJson`, and `mismatch`.

- [ ] **Step 1: Add Vitest and failing parser tests**

Cover canonical JSON, legacy text, `Mismatch:` wrapping, empty state, malformed JSON, and non-state messages. The canonical assertion is:

```ts
expect(parseStateMessage('{"i":2,"d":"draw","e":{"type":"none"},"s":"{\\"round\\":1}"}'))
  .toEqual({ index: 2, description: 'draw', stateJson: '{"round":1}', mismatch: false });
```

- [ ] **Step 2: Run the focused test and confirm red**

Run: `npm test -- --run src/utils/stateMessage.test.ts`

Expected: FAIL because `stateMessage.ts` does not exist.

- [ ] **Step 3: Implement the parser**

Decode optional `Mismatch:`, prefer JSON fields `i`, `d`, and `s`, then fall back to the anchored legacy regex. Validate field types and return `null` for malformed or non-state messages.

- [ ] **Step 4: Route `useWebSocket` through the parser**

Call `onMismatch` when `mismatch` is true, ignore an empty `stateJson`, parse the serialized game state, and preserve the existing error callback for invalid game JSON.

- [ ] **Step 5: Run focused tests and production build**

Run: `npm test -- --run src/utils/stateMessage.test.ts && npm run build`

Expected: all parser tests pass and Vite completes successfully.

- [ ] **Step 6: Commit**

```bash
git add web-player-ui/package.json web-player-ui/package-lock.json web-player-ui/src/hooks/useWebSocket.ts web-player-ui/src/utils/stateMessage.ts web-player-ui/src/utils/stateMessage.test.ts
git commit -m "fix: parse JSON state envelopes in web player"
```

### Task 2: Consistent Dart envelopes and push extraction

**Files:**
- Modify: `frosthaven_assistant_server/lib/game_server.dart`
- Modify: `frosthaven_assistant_server/lib/standalone_server.dart`
- Modify: `frosthaven_assistant_server/lib/main.dart`
- Modify: `frosthaven_assistant_server/pubspec.yaml`
- Modify: `frosthaven_assistant_server/pubspec.lock`
- Create: `frosthaven_assistant_server/test/state_message_test.dart`
- Create: `frosthaven_assistant_server/test/standalone_server_test.dart`

**Interfaces:**
- Produces: `GameServer.tryExtractState(String content): String?`
- Consumes: `GameServer.encodeStateEnvelope(...)` for every web-command broadcast.

- [ ] **Step 1: Write failing state-extraction tests**

Assert extraction from canonical JSON, `Mismatch:` JSON, legacy text, empty state, and malformed input.

- [ ] **Step 2: Write a failing web-command broadcast test**

Seed a minimal game state, apply `changeHealth`, capture `onStateBroadcast`, and assert `GameServer.tryDecodeStateEnvelope` succeeds for the broadcast.

- [ ] **Step 3: Run focused Dart tests and confirm red**

Run: `dart test test/state_message_test.dart test/standalone_server_test.dart`

Expected: FAIL because `tryExtractState` is absent and web commands still emit legacy text.

- [ ] **Step 4: Implement state extraction and canonical broadcasting**

Add `tryExtractState` beside the envelope codec, accepting an optional `Mismatch:` prefix and the legacy format. Change `applyWebCommand` to call `encodeStateEnvelope` with the no-event payload.

- [ ] **Step 5: Update push routing and dependency metadata**

Use `tryExtractState` in `main.dart`. Add `web_socket_channel` as a direct dependency so analyzer dependency checks reflect actual imports.

- [ ] **Step 6: Run Dart tests, analyzer, and compiler**

Run: `dart test && dart analyze && dart compile exe lib/main.dart -o /tmp/frosthaven-server-plan-check`

Expected: tests pass, analyzer exits zero, and the executable is generated.

- [ ] **Step 7: Commit**

```bash
git add frosthaven_assistant_server/lib frosthaven_assistant_server/test frosthaven_assistant_server/pubspec.yaml frosthaven_assistant_server/pubspec.lock
git commit -m "fix: keep server state broadcasts on JSON envelopes"
```

### Task 3: Integrated verification and branch publication

**Files:**
- Verify only; no new source files.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: one verified feature-branch SHA available from `mine`.

- [ ] **Step 1: Run all available local gates**

Run web tests/build and Dart tests/analyze/compile. If Dart is unavailable locally, run the complete Dart gate on EC2 before publication and report that distinction.

- [ ] **Step 2: Inspect repository state**

Run: `git diff --check`, `git status --short --branch`, and inspect the commits/diff against the task base.

- [ ] **Step 3: Push the verified branch**

Push `feature/web-player-ui` to `mine` without force and record the remote SHA. Do not modify upstream `origin`.

### Task 4: Native ARM64 staging and atomic EC2 deployment

**Files:**
- Remote staged release under `/opt/frosthaven/releases/<sha>`.
- Existing `/opt/frosthaven/server` and `/opt/frosthaven/web` replaced only after staging passes.

**Interfaces:**
- Consumes: exact remote SHA from Task 3.
- Produces: running systemd service on the candidate release or restored prior release.

- [ ] **Step 1: Start and inspect EC2**

Start `i-008d3235e7fa0d1bd`, wait for EC2/SSM health, and record service/Caddy/VAPID presence without printing secret contents.

- [ ] **Step 2: Clone and verify the exact SHA**

Clone the fork branch into `/opt/frosthaven/releases/<sha>/src`, assert `git rev-parse HEAD` equals the published SHA, and build server plus web UI on ARM64.

- [ ] **Step 3: Run staged gates**

Run Dart tests/analyzer/compiler and web tests/build from the staged checkout. Abort before touching the service on any failure.

- [ ] **Step 4: Back up and install**

Create SHA-labelled backups of the current binary and web directory. Install the candidate binary with mode `0755`, replace the web directory atomically, restart `frosthaven-server`, and retain VAPID/node/Caddy paths untouched.

- [ ] **Step 5: Roll back automatically on failed health**

If systemd is inactive, port `8080` does not return HTTP 200, or port `4567` is not listening, restore both backups and restart the prior service before returning a failure.

### Task 5: Production acceptance and handoff

**Files:**
- Verify only.

**Interfaces:**
- Consumes: running candidate from Task 4.
- Produces: production evidence and final instance state.

- [ ] **Step 1: Verify public HTTP/TLS assets**

Fetch `https://fh.epicbroccoli.com/`, require HTTP 200 through Caddy, and confirm asset hashes match the staged build.

- [ ] **Step 2: Verify WebSocket behavior**

Require `101 Switching Protocols`, parse the first canonical state envelope with the shipped parser, send `ping`, and require `{"type":"pong"}`.

- [ ] **Step 3: Verify a representative web command**

Use an isolated seeded server test or a reversible production-safe command fixture; require the returned state message to be canonical JSON. Do not mutate an active game session without confirming it is empty.

- [ ] **Step 4: Verify Flutter TCP initialization**

Send `init protocolVersion:1` to public port `4567` and require a framed canonical state envelope.

- [ ] **Step 5: Check logs and leave running**

Inspect systemd logs for the acceptance window, require both listeners and Caddy to remain active, and confirm EC2 state is `running`. Report any analyzer, dependency-audit, or infrastructure residuals separately from runtime acceptance.

