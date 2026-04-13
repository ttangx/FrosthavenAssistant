import 'package:web_socket_channel/web_socket_channel.dart';

import 'package:frosthaven_assistant_server/web_message_parser.dart';

/// Manages WebSocket connections from web browser clients.
///
/// Works alongside the existing TCP server -- this handles only the
/// WebSocket side (port 4568), while TCP clients continue on port 4567.
class WebSocketHandler {
  final Set<WebSocketChannel> _connections = {};

  /// Callback that returns the current game state JSON string.
  /// Set this before accepting connections.
  String Function()? getCurrentState;

  /// Called when a validated command should be applied to game state.
  bool Function(Map<String, dynamic> command, String description)? onCommand;

  /// Called when a client sends a push subscription.
  void Function(String characterId, Map<String, dynamic> subscription)? onPushSubscribe;

  /// Number of active WebSocket connections.
  int get connectionCount => _connections.length;

  /// Called when a new WebSocket client connects.
  void handleConnection(WebSocketChannel channel) {
    _connections.add(channel);
    print('Web client connected (${_connections.length} web clients)');

    // Send current game state to the new client.
    if (getCurrentState != null) {
      final state = getCurrentState!();
      channel.sink.add(state);
    }

    channel.stream.listen(
      (message) {
        _handleMessage(message, channel);
      },
      onError: (error) {
        print('Web client error: $error');
        _connections.remove(channel);
      },
      onDone: () {
        _connections.remove(channel);
        print('Web client disconnected (${_connections.length} web clients)');
      },
    );
  }

  void _handleMessage(dynamic rawMessage, WebSocketChannel channel) {
    if (rawMessage is! String) {
      print('Ignoring non-string WebSocket message');
      return;
    }

    try {
      final message = parseWebMessage(rawMessage);

      final action = message['action'] as String?;
      if (action == null) {
        print('Web message missing "action" field');
        return;
      }

      final requiredFields = requiredFieldsForAction(action);
      if (requiredFields == null) {
        print('Unsupported web action: $action');
        return;
      }

      final missing = validateMessage(message, requiredFields);
      if (missing.isNotEmpty) {
        print('Web message missing fields: ${missing.join(', ')}');
        return;
      }

      if (action == 'ping') {
        // Respond with pong to keep connection alive
        try {
          channel.sink.add('{"type":"pong"}');
        } catch (e) {
          print('Failed to send pong: $e');
        }
        return;
      }

      if (action == 'clientError') {
        final error = message['error'] as String? ?? 'unknown';
        final stack = message['stack'] as String? ?? '';
        final ua = message['userAgent'] as String? ?? '';
        print('CLIENT ERROR: $error');
        if (stack.isNotEmpty) print('  Stack: $stack');
        if (ua.isNotEmpty) print('  UA: $ua');
        return;
      }

      if (action == 'pushSubscribe') {
        final characterId = message['characterId'] as String;
        final subscription = message['subscription'] as Map<String, dynamic>;
        onPushSubscribe?.call(characterId, subscription);
        print('Push subscription received for $characterId');
        return;
      }

      final description = describeAction(message);

      if (onCommand != null) {
        final applied = onCommand!(message, description);
        if (!applied) {
          print('Web command not applied: $description');
        }
      } else {
        print('Web action (no handler): $description');
      }
    } catch (e) {
      print('Error parsing web message: $e');
    }
  }

  /// Broadcast a string message to all connected web clients.
  void broadcastToWebClients(String message) {
    for (final channel in _connections) {
      try {
        channel.sink.add(message);
      } catch (e) {
        print('Error broadcasting to web client: $e');
      }
    }
  }

  /// Close all WebSocket connections and clear the set.
  void closeAllConnections() {
    print('Closing ${_connections.length} web client connections');
    for (final channel in _connections) {
      try {
        channel.sink.close();
      } catch (e) {
        print('Error closing web client connection: $e');
      }
    }
    _connections.clear();
  }
}
