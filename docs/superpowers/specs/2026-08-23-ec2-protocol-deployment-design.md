# EC2 Protocol Integration and Deployment Design

## Goal

Make the merged FrosthavenAssistant server and web player interoperable, deploy the exact verified revision to the existing EC2 host without replacing it, and leave `fh.epicbroccoli.com` running after production verification.

## Protocol design

The JSON state envelope is the canonical protocol:

```json
{"i": 4, "d": "change health by -1", "e": {"type": "none"}, "s": "{...game state...}"}
```

The web client will accept both this envelope and the retired `Index:...Description:...GameState:...` format so cached clients and the currently installed server can overlap safely during deployment. Parsing belongs in a focused utility that returns the index, description, serialized state, and mismatch flag. Malformed or state-less messages are ignored without disconnecting.

Every server-originated state update, including web commands, will use `GameServer.encodeStateEnvelope`. Push-state handling will extract the serialized game state from either envelope format instead of searching only for `GameState:`.

## Tests

Vitest tests will cover new, legacy, mismatch, empty-state, and malformed web messages. Dart tests will cover JSON and legacy state extraction and verify web-command broadcasts use the JSON envelope. Existing production builds remain required gates.

## Deployment

The feature branch will be pushed to the `mine` fork after local verification. The stopped EC2 instance will be started and will build that exact Git SHA on its native ARM64 environment in a versioned staging directory.

Deployment will preserve `/opt/frosthaven/vapid.json`, `/opt/frosthaven/node_modules`, Caddy, and the existing systemd unit. The current server and web directory will be backed up, the staged artifacts installed atomically, and the service restarted. Any failed health or acceptance check restores the backups and restarts the previous version.

Acceptance requires:

- HTTPS returns the expected new web assets through Caddy.
- WebSocket upgrade succeeds, the first JSON state envelope is parsed, and ping/pong works.
- A representative web command returns a JSON state update.
- Flutter TCP protocol version 1 initializes successfully.
- The service remains active with no error-contaminated startup logs.

The instance remains running after acceptance. CloudFormation replacement is intentionally out of scope because the live VAPID private key and manually established Caddy state must first be migrated into managed infrastructure.

