import 'dart:io';

import 'package:shelf/shelf.dart' as shelf;
import 'package:shelf/shelf_io.dart' as shelf_io;
import 'package:shelf_static/shelf_static.dart';
import 'package:shelf_web_socket/shelf_web_socket.dart';

import 'package:frosthaven_assistant_server/game_server.dart';
import 'package:frosthaven_assistant_server/push_state.dart';
import 'package:frosthaven_assistant_server/standalone_server.dart';
import 'package:frosthaven_assistant_server/websocket_handler.dart';

const String _webRoot = '/opt/frosthaven/web';

void main() async {
  StandaloneServer server = StandaloneServer();
  final wsHandler = WebSocketHandler();
  final pushState = PushState();

  // Provide the WebSocket handler with a way to get current game state.
  wsHandler.getCurrentState = () => server.currentStateMessage('');

  // Bridge TCP state changes to WebSocket clients.
  server.onStateBroadcast = (data) {
    wsHandler.broadcastToWebClients(data);
    // Check push notification conditions on state change
    final gameState = GameServer.tryExtractState(data);
    if (gameState != null) {
      pushState.onStateChanged(gameState);
    }
  };

  // Route web commands through the server's command processor.
  wsHandler.onCommand = (command, description) {
    return server.applyWebCommand(command, description);
  };

  // Handle push subscriptions from web clients.
  wsHandler.onPushSubscribe = (characterId, subscription) {
    pushState.subscribe(characterId, subscription);
  };

  // Start the HTTP/WebSocket server on port 8080 (Caddy reverse-proxies 80/443 here).
  late final HttpServer httpServer;
  try {
    httpServer = await _startWebSocketServer(wsHandler, 8080);
  } catch (e) {
    print('Failed to start WebSocket server on port 8080: $e');
    exit(1);
  }

  ProcessSignal.sigint.watch().listen((signal) async {
    print('Received SIGINT signal, shutting down gracefully...');
    pushState.dispose();
    wsHandler.closeAllConnections();
    await httpServer.close();
    server.stopServer("Shutdown Requested");
    exit(0);
  });
  if (!Platform.isWindows) {
    ProcessSignal.sigterm.watch().listen((signal) async {
      print('Received SIGTERM signal, shutting down gracefully...');
      pushState.dispose();
      wsHandler.closeAllConnections();
      await httpServer.close();
      server.stopServer("Shutdown Requested");
      exit(0);
    });
  }

  print("Starting Server");
  // TCP server on port 4567 for Flutter app clients (existing protocol).
  await server.startServerInternal("0.0.0.0", 4567);
}

/// Starts an HTTP server with WebSocket at /ws and static file serving.
Future<HttpServer> _startWebSocketServer(
    WebSocketHandler wsHandler, int port) async {
  final wsEndpoint = webSocketHandler((channel) {
    wsHandler.handleConnection(channel);
  });

  // Serve static web UI files if the directory exists.
  final webDir = Directory(_webRoot);
  final bool hasWebUI = webDir.existsSync();
  if (hasWebUI) {
    print('Serving web UI from $_webRoot');
  } else {
    print('Web UI directory $_webRoot not found, serving WebSocket only');
  }

  final staticHandler = hasWebUI
      ? createStaticHandler(_webRoot, defaultDocument: 'index.html')
      : null;

  final handler = const shelf.Pipeline()
      .addHandler((shelf.Request request) {
    // WebSocket endpoint
    if (request.url.path == 'ws') {
      return wsEndpoint(request);
    }
    // Static files (web UI)
    if (staticHandler != null) {
      return staticHandler(request);
    }
    return shelf.Response.notFound('Not found');
  });

  final httpServer = await shelf_io.serve(handler, '0.0.0.0', port);
  print('HTTP server listening on port ${httpServer.port}');
  return httpServer;
}
